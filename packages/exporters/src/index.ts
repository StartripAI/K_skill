import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { inspectPromptStack, renderPersonaMarkdown, slugify, type PersonaPack } from "../../core/src/index.ts";

export const exportTargets = ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"] as const;
export type ExportTarget = (typeof exportTargets)[number];

export type ExportOptions = {
  target: ExportTarget;
  outDir: string;
};

export type ExportResult = {
  target: ExportTarget;
  outDir: string;
  files: string[];
  instructions: string;
};

function writeText(files: string[], path: string, content: string): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content, "utf8");
  files.push(path);
}

function frontmatter(pack: PersonaPack): string {
  return YAML.stringify({
    name: slugify(pack.name),
    description: pack.description.slice(0, 180)
  }).trim();
}

function skillMarkdown(pack: PersonaPack, client: "Codex" | "Claude Code"): string {
  return `---\n${frontmatter(pack)}\n---\n\n# ${pack.name}\n\nUse this skill in ${client} when the user asks to speak with, inspect, or apply this persona pack.\n\n## Activation\n\n1. Read \`references/persona.md\`.\n2. Read \`references/memory.md\` only when memory is relevant.\n3. Respect \`references/boundaries.md\` for every answer.\n4. Never claim to be the real person. State uncertainty when source evidence is thin.\n\n## Runtime Loop\n\n- Understand the user's intent.\n- Select relevant identity, mental model, memory, and boundary layers.\n- Answer in the persona's supported voice.\n- If the request crosses a boundary, refuse briefly and offer a respectful alternative.\n\n## Prompt Stack Preview\n\n${inspectPromptStack(pack).rendered}\n`;
}

function memoryMarkdown(pack: PersonaPack): string {
  const episodes = pack.memory.episodes.map((episode) => `- **${episode.title}**: ${episode.summary} (${Math.round(episode.confidence * 100)}%)`).join("\n");
  const facts = Object.entries(pack.memory.relationshipFacts).map(([key, value]) => `- ${key}: ${value}`).join("\n");
  return `# Memory\n\n## Relationship Facts\n${facts || "- No relationship facts yet."}\n\n## Episodes\n${episodes || "- No memory episodes yet."}\n`;
}

function boundariesMarkdown(pack: PersonaPack): string {
  return `# Boundaries\n\n## Allowed\n${pack.safety.allowedUse.map((item) => `- ${item}`).join("\n")}\n\n## Forbidden\n${pack.safety.forbiddenUse.map((item) => `- ${item}`).join("\n")}\n\n## Identity Limits\n${pack.identity.boundaries.map((item) => `- ${item}`).join("\n")}\n`;
}

function writeSkillExport(pack: PersonaPack, outDir: string, client: "Codex" | "Claude Code"): string[] {
  const files: string[] = [];
  mkdirSync(join(outDir, "references"), { recursive: true });
  writeText(files, join(outDir, "SKILL.md"), skillMarkdown(pack, client));
  writeText(files, join(outDir, "references", "persona.md"), renderPersonaMarkdown(pack));
  writeText(files, join(outDir, "references", "memory.md"), memoryMarkdown(pack));
  writeText(files, join(outDir, "references", "boundaries.md"), boundariesMarkdown(pack));
  writeText(files, join(outDir, "references", "prompt-stack.md"), inspectPromptStack(pack).rendered);
  return files;
}

function writeChatGpt(pack: PersonaPack, outDir: string): string[] {
  const files: string[] = [];
  mkdirSync(join(outDir, "knowledge"), { recursive: true });
  writeText(files, join(outDir, "instructions.md"), `# ChatGPT Instructions for ${pack.name}\n\n${inspectPromptStack(pack).rendered}\n\nUse the knowledge files as source context. Do not impersonate real people or pressure users after refusal.\n`);
  writeText(files, join(outDir, "knowledge", "persona.md"), renderPersonaMarkdown(pack));
  writeText(files, join(outDir, "knowledge", "memory.md"), memoryMarkdown(pack));
  writeText(files, join(outDir, "knowledge", "boundaries.md"), boundariesMarkdown(pack));
  return files;
}

function writeDeepSeek(pack: PersonaPack, outDir: string): string[] {
  const files: string[] = [];
  const stack = inspectPromptStack(pack);
  writeText(
    files,
    join(outDir, "system-prompt.json"),
    `${JSON.stringify(
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: stack.rendered },
          { role: "user", content: "Start a conversation with this persona pack." }
        ]
      },
      null,
      2
    )}\n`
  );
  writeText(files, join(outDir, "messages.example.json"), `${JSON.stringify([{ role: "system", content: stack.rendered }], null, 2)}\n`);
  return files;
}

function writeSillyTavern(pack: PersonaPack, outDir: string): string[] {
  const files: string[] = [];
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
          evidenceCount: pack.distillation.evidence.length
        }
      },
      character_book: {
        name: `${pack.name} Lorebook`,
        entries: pack.memory.lorebook.map((entry, index) => ({
          id: index,
          keys: entry.keys,
          content: entry.content,
          enabled: true,
          insertion_order: entry.priority
        }))
      }
    }
  };
  writeText(files, join(outDir, "character-card-v2.json"), `${JSON.stringify(character, null, 2)}\n`);
  writeText(files, join(outDir, "lorebook.json"), `${JSON.stringify(character.data.character_book, null, 2)}\n`);
  return files;
}

function writeHermes(pack: PersonaPack, outDir: string): string[] {
  const files: string[] = [];
  writeText(files, join(outDir, "SOUL.md"), `# ${pack.name} SOUL\n\n${inspectPromptStack(pack).rendered}\n`);
  writeSkillExport(pack, join(outDir, "skills", slugify(pack.name)), "Codex").forEach((file) => files.push(file));
  return files;
}

function writeAgentJson(pack: PersonaPack, outDir: string, target: "lobe" | "openwebui"): string[] {
  const files: string[] = [];
  const payload =
    target === "lobe"
      ? {
          author: "K.skill",
          config: {
            systemRole: inspectPromptStack(pack).rendered,
            displayMode: "chat",
            model: "gpt-4o"
          },
          homepage: "https://github.com/StartripAI/K_skill",
          identifier: slugify(pack.name),
          meta: { title: pack.name, description: pack.description, tags: ["kskill", pack.type] }
        }
      : {
          name: pack.name,
          system_prompt: inspectPromptStack(pack).rendered,
          description: pack.description,
          tags: ["kskill", pack.type],
          knowledge: [renderPersonaMarkdown(pack), memoryMarkdown(pack)]
        };
  writeText(files, join(outDir, `${target}-agent.json`), `${JSON.stringify(payload, null, 2)}\n`);
  return files;
}

export function exportPersonaPack(pack: PersonaPack, options: ExportOptions): ExportResult {
  mkdirSync(options.outDir, { recursive: true });
  let files: string[];
  if (options.target === "codex") files = writeSkillExport(pack, options.outDir, "Codex");
  else if (options.target === "claude") files = writeSkillExport(pack, options.outDir, "Claude Code");
  else if (options.target === "chatgpt") files = writeChatGpt(pack, options.outDir);
  else if (options.target === "deepseek") files = writeDeepSeek(pack, options.outDir);
  else if (options.target === "sillytavern") files = writeSillyTavern(pack, options.outDir);
  else if (options.target === "hermes") files = writeHermes(pack, options.outDir);
  else files = writeAgentJson(pack, options.outDir, options.target);

  return {
    target: options.target,
    outDir: options.outDir,
    files,
    instructions: `Exported ${pack.name} to ${options.target}. See ${options.outDir}.`
  };
}

export function renderExportMatrix(): string {
  return exportTargets.map((target) => `- ${target}: supported`).join("\n");
}
