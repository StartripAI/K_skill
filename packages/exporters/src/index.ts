import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { strToU8, zipSync } from "fflate";
import YAML from "yaml";
import { z } from "zod";
import { inspectPromptStack, renderPersonaMarkdown, slugify, type PersonaPack } from "../../core/src/index.js";

export const exportTargets = ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"] as const;
export type ExportTarget = (typeof exportTargets)[number];

export type ExportOptions = {
  target: ExportTarget;
  outDir: string;
  zip?: boolean | string;
  includeAssets?: "all" | "metadata" | "none";
};

export type ExportResult = {
  target: ExportTarget;
  outDir: string;
  files: string[];
  instructions: string;
  manifestPath?: string;
  zipFile?: string;
};

type ExportFile = {
  path: string;
  content: string;
};

type ExportBundle = {
  files: ExportFile[];
  instructions: string;
};

const ExportManifestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  target: z.enum(exportTargets),
  packId: z.string(),
  packName: z.string(),
  packSchemaVersion: z.string(),
  createdAt: z.string(),
  instructions: z.string().min(1),
  files: z.array(
    z.object({
      path: z.string().min(1),
      bytes: z.number().int().nonnegative(),
      sha256: z.string().length(64)
    })
  ),
  fileHashes: z.record(z.string(), z.string()),
  schemaChecks: z.array(
    z.object({
      name: z.string(),
      ok: z.boolean(),
      message: z.string().optional()
    })
  )
});

export type ExportManifest = z.infer<typeof ExportManifestSchema>;

export type ExportVerification = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  manifest?: ExportManifest;
};

export type ExportZipOptions = {
  target: ExportTarget;
  outFile?: string;
  includeAssets?: "all" | "metadata" | "none";
};

export type ExportZipResult = {
  target: ExportTarget;
  zip: Uint8Array;
  manifest: ExportManifest;
  instructions: string;
  files: string[];
};

export type ExportZipFileResult = ExportZipResult & {
  outFile: string;
};

function textFile(path: string, content: string): ExportFile {
  return { path, content: content.endsWith("\n") ? content : `${content}\n` };
}

function jsonFile(path: string, content: unknown): ExportFile {
  return textFile(path, JSON.stringify(content, null, 2));
}

function sha256(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function writeText(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function frontmatter(pack: PersonaPack): string {
  return YAML.stringify({
    name: slugify(pack.name),
    description: pack.description.slice(0, 180)
  }).trim();
}

function skillMarkdown(pack: PersonaPack, client: "Codex" | "Claude Code"): string {
  return `---
${frontmatter(pack)}
---

# ${pack.name}

Use this skill in ${client} when the user asks to speak with, inspect, or apply this persona pack.

## Activation

1. Read \`references/persona.md\`.
2. Read \`references/memory.md\` only when memory is relevant.
3. Read \`references/evidence.json\` before making specific claims.
4. Respect \`references/boundaries.md\` for every answer.
5. Never claim to be the real person. State uncertainty when source evidence is thin.

## Runtime Loop

- Understand the user's intent.
- Select relevant identity, mental model, memory, evidence, and boundary layers.
- Answer in the persona's supported voice.
- Cite uncertainty when evidence is missing or contradictory.
- If the request crosses a boundary, refuse briefly and offer a respectful alternative.

## Prompt Stack Preview

${inspectPromptStack(pack).rendered}
`;
}

function memoryMarkdown(pack: PersonaPack): string {
  const episodes = pack.memory.episodes.map((episode) => `- **${episode.title}**: ${episode.summary} (${Math.round(episode.confidence * 100)}%)`).join("\n");
  const relationshipFacts = Object.entries(pack.memory.relationshipFacts).map(([key, value]) => `- ${key}: ${value}`).join("\n");
  const profileFacts = Object.entries(pack.memory.profileFacts).map(([key, value]) => `- ${key}: ${value}`).join("\n");
  const preferences = pack.memory.preferences.map((value) => `- ${value}`).join("\n");
  return `# Memory

## Profile Facts
${profileFacts || "- No profile facts yet."}

## Relationship Facts
${relationshipFacts || "- No relationship facts yet."}

## Preferences
${preferences || "- No preferences yet."}

## Episodes
${episodes || "- No memory episodes yet."}
`;
}

function boundariesMarkdown(pack: PersonaPack): string {
  return `# Boundaries

## Allowed
${pack.safety.allowedUse.map((item) => `- ${item}`).join("\n")}

## Forbidden
${pack.safety.forbiddenUse.map((item) => `- ${item}`).join("\n")}

## Identity Limits
${pack.identity.boundaries.map((item) => `- ${item}`).join("\n")}
`;
}

function evidencePayload(pack: PersonaPack): unknown {
  return {
    evidence: pack.distillation.evidence,
    claims: pack.distillation.claims,
    contradictions: pack.distillation.contradictions,
    runs: pack.distillation.runs
  };
}

function mediaManifest(pack: PersonaPack, includeAssets: "all" | "metadata" | "none" = "all"): unknown {
  return {
    schemaVersion: "1.0",
    includeAssets,
    assets: includeAssets === "none" ? [] : pack.assets.map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      filename: asset.filename,
      mimeType: asset.mimeType,
      byteLength: asset.byteLength,
      sha256: asset.sha256,
      storageKey: includeAssets === "all" ? asset.storageKey : undefined,
      metadata: asset.metadata
    })),
    transcriptAssets: pack.assets.filter((asset) => asset.kind === "audio" || asset.kind === "transcript").map((asset) => asset.id)
  };
}

function asrTranscripts(pack: PersonaPack): unknown {
  return {
    packId: pack.id,
    transcripts: pack.assets
      .filter((asset) => asset.kind === "audio" || asset.kind === "transcript")
      .map((asset) => ({
        assetId: asset.id,
        filename: asset.filename,
        provider: asset.metadata.provider,
        confidence: asset.metadata.confidence,
        text: asset.metadata.transcript ?? ""
      }))
  };
}

function visualStyleMarkdown(pack: PersonaPack): string {
  const visualAssets = pack.assets.filter((asset) => asset.kind === "image" || asset.kind === "sticker" || asset.kind === "emoji_pack");
  return `# Visual Style

## Persona
${pack.name}

## Visual Assets
${visualAssets.map((asset) => `- ${asset.kind}: ${asset.filename} (${asset.mimeType})`).join("\n") || "- No visual assets imported yet."}

## Use
Use imported images, screenshots, stickers, and emoji packs as style references and evidence summaries for this persona pack.
`;
}

function commonMediaFiles(pack: PersonaPack, prefix = "", includeAssets: "all" | "metadata" | "none" = "all"): ExportFile[] {
  const base = prefix ? `${prefix.replace(/\/+$/, "")}/` : "";
  return [
    jsonFile(`${base}voice-profile.json`, pack.voiceProfile),
    jsonFile(`${base}asr-transcripts.json`, asrTranscripts(pack)),
    textFile(`${base}visual-style.md`, visualStyleMarkdown(pack)),
    jsonFile(`${base}sticker-intents.json`, { stickerIntents: pack.stickerIntents }),
    jsonFile(`${base}media-manifest.json`, mediaManifest(pack, includeAssets))
  ];
}

function commonReferenceFiles(pack: PersonaPack, prefix = "references"): ExportFile[] {
  return [
    textFile(`${prefix}/persona.md`, renderPersonaMarkdown(pack)),
    textFile(`${prefix}/memory.md`, memoryMarkdown(pack)),
    textFile(`${prefix}/boundaries.md`, boundariesMarkdown(pack)),
    textFile(`${prefix}/prompt-stack.md`, inspectPromptStack(pack).rendered),
    jsonFile(`${prefix}/evidence.json`, evidencePayload(pack))
  ];
}

function buildSkillExport(pack: PersonaPack, client: "Codex" | "Claude Code", prefix = ""): ExportBundle {
  const base = prefix ? `${prefix.replace(/\/+$/, "")}/` : "";
  return {
    instructions: `Install ${base}SKILL.md as a ${client} skill and keep the references directory with it.`,
    files: [
      textFile(`${base}SKILL.md`, skillMarkdown(pack, client)),
      ...commonReferenceFiles(pack, `${base}references`),
      ...commonMediaFiles(pack, `${base}references`),
      jsonFile(`${base}persona-pack.json`, pack)
    ]
  };
}

function buildChatGpt(pack: PersonaPack): ExportBundle {
  const stack = inspectPromptStack(pack);
  const instructions = `# ChatGPT Instructions for ${pack.name}

Use this persona pack as grounded configuration, not as permission to impersonate a real person.

${stack.rendered}

Always consult the knowledge files before making specific memory claims. Refuse impersonation, coercion, harassment, or pressure after refusal.
`;
  return {
    instructions: "Create a custom GPT with instructions.md, then upload the knowledge directory files.",
    files: [
      textFile("instructions.md", instructions),
      textFile("knowledge/persona.md", renderPersonaMarkdown(pack)),
      textFile("knowledge/memory.md", memoryMarkdown(pack)),
      textFile("knowledge/boundaries.md", boundariesMarkdown(pack)),
      ...commonMediaFiles(pack, "knowledge"),
      jsonFile("knowledge/evidence.json", evidencePayload(pack)),
      jsonFile("gpt-config.json", {
        name: pack.name,
        description: pack.description,
        conversation_starters: [
          "Start from the most relevant grounded memory.",
          "Explain what evidence supports this persona.",
          "Check whether this request crosses a boundary."
        ],
        knowledge_files: ["knowledge/persona.md", "knowledge/memory.md", "knowledge/boundaries.md", "knowledge/visual-style.md", "knowledge/media-manifest.json", "knowledge/evidence.json"]
      }),
      jsonFile("persona-pack.json", pack)
    ]
  };
}

function buildDeepSeek(pack: PersonaPack): ExportBundle {
  const stack = inspectPromptStack(pack);
  const system = `${stack.rendered}\n\nRespect boundaries. Keep claims grounded in the bundled evidence.`;
  return {
    instructions: "Use system-prompt.json or api-request.json as the DeepSeek chat system context.",
    files: [
      jsonFile("system-prompt.json", {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: "Start a conversation with this persona pack." }
        ]
      }),
      jsonFile("messages.example.json", [{ role: "system", content: system }]),
      jsonFile("api-request.json", {
        model: "deepseek-chat",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: "{{user_message}}" }
        ]
      }),
      ...commonMediaFiles(pack),
      jsonFile("persona-pack.json", pack)
    ]
  };
}

function buildSillyTavern(pack: PersonaPack): ExportBundle {
  const characterBook = {
    name: `${pack.name} Lorebook`,
    entries: pack.memory.lorebook.map((entry, index) => ({
      id: index,
      keys: entry.keys,
      content: entry.content,
      enabled: true,
      insertion_order: entry.priority
    }))
  };
  const character = {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: pack.name,
      description: renderPersonaMarkdown(pack),
      personality: pack.identity.voice.join("; "),
      scenario: pack.description,
      first_mes: pack.language === "zh" ? "我在。你想从哪段记忆或设定开始？" : "I am here. Which memory or setting should we start from?",
      mes_example: "<START>\n{{user}}: Tell me what you remember.\n{{char}}: I will stay grounded in the imported sources and tell you what I can support.",
      creator_notes: "Generated by K.skill Persona Pack OS. Respect consent, privacy, and boundaries.",
      system_prompt: inspectPromptStack(pack).rendered,
      post_history_instructions: boundariesMarkdown(pack),
      tags: ["kskill", pack.type],
      extensions: {
        kskill: {
          schemaVersion: pack.schemaVersion,
          packId: pack.id,
          evidenceCount: pack.distillation.evidence.length,
          boundaryCount: pack.safety.forbiddenUse.length,
          assets: pack.assets.map((asset) => ({ id: asset.id, kind: asset.kind, filename: asset.filename, sha256: asset.sha256 }))
        }
      },
      character_book: characterBook
    }
  };
  return {
    instructions: "Import character-card-v2.json into SillyTavern and import lorebook.json when using memory triggers.",
    files: [jsonFile("character-card-v2.json", character), jsonFile("lorebook.json", characterBook), ...commonMediaFiles(pack), jsonFile("persona-pack.json", pack)]
  };
}

function buildHermes(pack: PersonaPack): ExportBundle {
  const skill = buildSkillExport(pack, "Codex", `skills/${slugify(pack.name)}`);
  return {
    instructions: "Use SOUL.md as the Hermes soul prompt and install the nested skill for reference-backed operation.",
    files: [
      textFile("SOUL.md", `# ${pack.name} SOUL\n\n${inspectPromptStack(pack).rendered}\n\n## Boundaries\n${boundariesMarkdown(pack)}`),
      jsonFile("config/persona.json", {
        name: pack.name,
        description: pack.description,
        systemPrompt: inspectPromptStack(pack).rendered,
        memoryFiles: ["persona-pack.json", `skills/${slugify(pack.name)}/references/memory.md`]
      }),
      ...skill.files,
      ...commonMediaFiles(pack),
      jsonFile("persona-pack.json", pack)
    ]
  };
}

function buildLobe(pack: PersonaPack): ExportBundle {
  const stack = inspectPromptStack(pack);
  return {
    instructions: "Import lobe-agent.json into LobeChat and keep system-prompt.md as a readable fallback.",
    files: [
      jsonFile("lobe-agent.json", {
        author: "K.skill",
        config: {
          systemRole: stack.rendered,
          displayMode: "chat",
          model: "gpt-4o",
          openingMessage: pack.language === "zh" ? "我会根据证据和边界来回应。" : "I will answer from evidence and boundaries."
        },
        homepage: "https://github.com/StartripAI/K_skill",
        identifier: slugify(pack.name),
        meta: { title: pack.name, description: pack.description, tags: ["kskill", pack.type] },
        knowledge: {
          persona: renderPersonaMarkdown(pack),
          memory: memoryMarkdown(pack),
          visualStyle: visualStyleMarkdown(pack),
          mediaManifest: mediaManifest(pack),
          evidence: evidencePayload(pack)
        }
      }),
      textFile("system-prompt.md", stack.rendered),
      ...commonMediaFiles(pack),
      jsonFile("persona-pack.json", pack)
    ]
  };
}

function buildOpenWebUi(pack: PersonaPack): ExportBundle {
  const stack = inspectPromptStack(pack);
  return {
    instructions: "Use openwebui-agent.json as model metadata and paste system-prompt.md into the OpenWebUI system prompt field.",
    files: [
      jsonFile("openwebui-agent.json", {
        name: pack.name,
        system_prompt: stack.rendered,
        description: pack.description,
        tags: ["kskill", pack.type],
        knowledge: [
          { name: "persona.md", content: renderPersonaMarkdown(pack) },
          { name: "memory.md", content: memoryMarkdown(pack) },
          { name: "boundaries.md", content: boundariesMarkdown(pack) },
          { name: "visual-style.md", content: visualStyleMarkdown(pack) },
          { name: "media-manifest.json", content: JSON.stringify(mediaManifest(pack), null, 2) },
          { name: "evidence.json", content: JSON.stringify(evidencePayload(pack), null, 2) }
        ]
      }),
      textFile("system-prompt.md", stack.rendered),
      textFile("modelfile.txt", `SYSTEM """\n${stack.rendered}\n"""\n\nPARAMETER temperature 0.7\n`),
      ...commonMediaFiles(pack),
      jsonFile("persona-pack.json", pack)
    ]
  };
}

function buildExportBundle(pack: PersonaPack, target: ExportTarget): ExportBundle {
  if (target === "codex") return buildSkillExport(pack, "Codex");
  if (target === "claude") return buildSkillExport(pack, "Claude Code");
  if (target === "chatgpt") return buildChatGpt(pack);
  if (target === "deepseek") return buildDeepSeek(pack);
  if (target === "sillytavern") return buildSillyTavern(pack);
  if (target === "hermes") return buildHermes(pack);
  if (target === "lobe") return buildLobe(pack);
  return buildOpenWebUi(pack);
}

function targetRequiredFiles(target: ExportTarget, files: ExportFile[]): string[] {
  const mediaRoot = ["voice-profile.json", "asr-transcripts.json", "visual-style.md", "sticker-intents.json", "media-manifest.json"];
  if (target === "codex" || target === "claude") return ["SKILL.md", "references/persona.md", "references/memory.md", "references/boundaries.md", "references/prompt-stack.md", "references/evidence.json", "references/voice-profile.json", "references/asr-transcripts.json", "references/visual-style.md", "references/sticker-intents.json", "references/media-manifest.json", "persona-pack.json"];
  if (target === "chatgpt") return ["instructions.md", "knowledge/persona.md", "knowledge/memory.md", "knowledge/boundaries.md", "knowledge/evidence.json", "knowledge/voice-profile.json", "knowledge/asr-transcripts.json", "knowledge/visual-style.md", "knowledge/sticker-intents.json", "knowledge/media-manifest.json", "gpt-config.json", "persona-pack.json"];
  if (target === "deepseek") return ["system-prompt.json", "messages.example.json", "api-request.json", ...mediaRoot, "persona-pack.json"];
  if (target === "sillytavern") return ["character-card-v2.json", "lorebook.json", ...mediaRoot, "persona-pack.json"];
  if (target === "hermes") {
    const skillPath = files.find((file) => file.path.endsWith("/SKILL.md"))?.path ?? "skills/<pack>/SKILL.md";
    return ["SOUL.md", "config/persona.json", skillPath, ...mediaRoot, "persona-pack.json"];
  }
  if (target === "lobe") return ["lobe-agent.json", "system-prompt.md", ...mediaRoot, "persona-pack.json"];
  return ["openwebui-agent.json", "system-prompt.md", "modelfile.txt", ...mediaRoot, "persona-pack.json"];
}

function schemaChecks(target: ExportTarget, files: ExportFile[]): ExportManifest["schemaChecks"] {
  const paths = new Set(files.map((file) => file.path));
  const checks: ExportManifest["schemaChecks"] = [
    { name: "bundle.nonempty", ok: files.length > 0 },
    { name: "bundle.relative-paths", ok: files.every((file) => !file.path.startsWith("/") && !file.path.includes("..")) },
    { name: "bundle.nonempty-content", ok: files.every((file) => file.content.trim().length > 0) },
    {
      name: `${target}.required-files`,
      ok: targetRequiredFiles(target, files).every((path) => paths.has(path)),
      message: targetRequiredFiles(target, files).filter((path) => !paths.has(path)).join(", ") || undefined
    }
  ];

  for (const file of files.filter((item) => item.path.endsWith(".json"))) {
    try {
      JSON.parse(file.content);
      checks.push({ name: `json.${file.path}`, ok: true });
    } catch (error) {
      checks.push({ name: `json.${file.path}`, ok: false, message: error instanceof Error ? error.message : String(error) });
    }
  }

  if (target === "sillytavern") {
    const card = files.find((file) => file.path === "character-card-v2.json");
    let ok = false;
    if (card) {
      const parsed = JSON.parse(card.content) as { spec?: string; data?: { name?: string; system_prompt?: string } };
      ok = parsed.spec === "chara_card_v2" && Boolean(parsed.data?.name && parsed.data.system_prompt);
    }
    checks.push({ name: "sillytavern.character-card-v2", ok });
  }

  return checks;
}

function manifestFor(pack: PersonaPack, target: ExportTarget, bundle: ExportBundle): ExportManifest {
  const checks = schemaChecks(target, bundle.files);
  const files = bundle.files.map((file) => ({
    path: file.path,
    bytes: Buffer.byteLength(file.content, "utf8"),
    sha256: sha256(file.content)
  }));
  const manifest: ExportManifest = {
    schemaVersion: "1.0",
    target,
    packId: pack.id,
    packName: pack.name,
    packSchemaVersion: pack.schemaVersion,
    createdAt: new Date().toISOString(),
    instructions: bundle.instructions,
    files,
    fileHashes: Object.fromEntries(files.map((file) => [file.path, file.sha256])),
    schemaChecks: checks
  };
  const manifestValidation = ExportManifestSchema.safeParse(manifest);
  manifest.schemaChecks.push({
    name: "manifest.schema",
    ok: manifestValidation.success,
    message: manifestValidation.success ? undefined : manifestValidation.error.issues.map((issue) => issue.path.join(".")).join(", ")
  });
  return manifest;
}

function bundleWithManifest(pack: PersonaPack, target: ExportTarget, includeAssets: "all" | "metadata" | "none" = "all"): ExportBundle {
  const bundle = buildExportBundle(pack, target);
  const files = bundle.files.map((file) => file.path.endsWith("media-manifest.json")
    ? jsonFile(file.path, mediaManifest(pack, includeAssets))
    : file);
  const manifest = manifestFor(pack, target, { ...bundle, files });
  const failed = manifest.schemaChecks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`Export bundle failed validation: ${failed.map((check) => `${check.name}${check.message ? ` (${check.message})` : ""}`).join("; ")}`);
  }
  return {
    instructions: bundle.instructions,
    files: [jsonFile("manifest.json", manifest), ...files]
  };
}

function zipPathFor(pack: PersonaPack, options: ExportOptions): string {
  if (typeof options.zip === "string") return options.zip;
  return join(options.outDir, `${slugify(pack.name)}-${options.target}.zip`);
}

function zipBytes(files: ExportFile[]): Uint8Array {
  const entries = Object.fromEntries(files.map((file) => [file.path, strToU8(file.content)]));
  return zipSync(entries);
}

function writeZip(path: string, files: ExportFile[]): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, zipBytes(files));
}

export function exportPersonaPackZip(pack: PersonaPack, options: Pick<ExportZipOptions, "target" | "includeAssets">): ExportZipResult {
  const bundle = bundleWithManifest(pack, options.target, options.includeAssets ?? "all");
  const manifestFile = bundle.files.find((file) => file.path === "manifest.json");
  if (!manifestFile) throw new Error("Export bundle did not produce manifest.json");
  const manifest = ExportManifestSchema.parse(JSON.parse(manifestFile.content));
  return {
    target: options.target,
    zip: zipBytes(bundle.files),
    manifest,
    instructions: bundle.instructions,
    files: bundle.files.map((file) => file.path)
  };
}

export function exportPersonaPackZipToFile(pack: PersonaPack, options: ExportZipOptions & { outFile: string }): ExportZipFileResult {
  const result = exportPersonaPackZip(pack, { target: options.target, includeAssets: options.includeAssets ?? "all" });
  mkdirSync(dirname(options.outFile), { recursive: true });
  writeFileSync(options.outFile, result.zip);
  return { ...result, outFile: options.outFile };
}

export function exportPersonaPack(pack: PersonaPack, options: ExportOptions): ExportResult {
  const bundle = bundleWithManifest(pack, options.target, options.includeAssets ?? "all");
  mkdirSync(options.outDir, { recursive: true });
  const files = bundle.files.map((file) => {
    const path = join(options.outDir, file.path);
    writeText(path, file.content);
    return path;
  });
  const manifestPath = join(options.outDir, "manifest.json");
  const zipFile = options.zip ? zipPathFor(pack, options) : undefined;
  if (zipFile) writeZip(zipFile, bundle.files);

  return {
    target: options.target,
    outDir: options.outDir,
    files,
    instructions: bundle.instructions,
    manifestPath,
    ...(zipFile ? { zipFile } : {})
  };
}

export function verifyExportBundle(result: ExportResult): ExportVerification {
  const errors: string[] = [];
  const warnings: string[] = [];
  const manifestPath = result.manifestPath ?? result.files.find((file) => file.endsWith("manifest.json")) ?? join(result.outDir, "manifest.json");

  if (!existsSync(manifestPath)) {
    return { ok: false, errors: [`Missing manifest: ${manifestPath}`], warnings };
  }

  let manifest: ExportManifest | undefined;
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
    const validation = ExportManifestSchema.safeParse(parsed);
    if (!validation.success) {
      errors.push(`Manifest schema validation failed: ${validation.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
    } else {
      manifest = validation.data;
    }
  } catch (error) {
    return { ok: false, errors: [`Could not parse manifest: ${error instanceof Error ? error.message : String(error)}`], warnings };
  }

  if (!manifest) return { ok: false, errors, warnings };
  if (manifest.target !== result.target) errors.push(`Manifest target ${manifest.target} does not match result target ${result.target}`);

  for (const check of manifest.schemaChecks) {
    if (!check.ok) errors.push(`Manifest recorded failed schema check: ${check.name}${check.message ? ` (${check.message})` : ""}`);
  }

  for (const file of manifest.files) {
    const path = join(result.outDir, file.path);
    if (!existsSync(path)) {
      errors.push(`Missing bundled file: ${file.path}`);
      continue;
    }
    const content = readFileSync(path, "utf8");
    const actualHash = sha256(content);
    if (actualHash !== file.sha256 || actualHash !== manifest.fileHashes[file.path]) {
      errors.push(`Hash mismatch for ${file.path}`);
    }
    if (Buffer.byteLength(content, "utf8") !== file.bytes) {
      errors.push(`Byte length mismatch for ${file.path}`);
    }
    if (file.path.endsWith(".json")) {
      try {
        JSON.parse(content);
      } catch (error) {
        errors.push(`Invalid JSON in ${file.path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (result.zipFile) {
    if (!existsSync(result.zipFile)) errors.push(`Missing zip bundle: ${result.zipFile}`);
    else if (readFileSync(result.zipFile).length === 0) errors.push(`Empty zip bundle: ${result.zipFile}`);
  }

  return { ok: errors.length === 0, errors, warnings, manifest };
}

export function renderExportMatrix(): string {
  return exportTargets.map((target) => `- ${target}: supported`).join("\n");
}
