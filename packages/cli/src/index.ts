#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { Command } from "commander";
import {
  createPersonaPack,
  inspectPromptStack,
  renderPersonaMarkdown,
  slugify,
  validatePersonaPack,
  type PackLanguage,
  type PersonaPack,
  type PersonaType
} from "../../core/src/index.js";
import { distillPersonaPack, distillPersonaPackAsync, renderDistillationSummary, type DistillProviderName } from "../../distiller/src/index.js";
import { parseChatText, parseImport, type ParsedSource } from "../../importers/src/index.js";
import { loadPack, parseSourceFromFile, savePack, writeJsonFile, writeTextFile } from "../../pack-io/src/index.js";
import {
  analyzePursuit,
  assessSendDecision,
  generateReplyLab,
  generateReplySuggestions,
  generateTopicPlan,
  renderPursuitReport,
  renderReplies,
  type PursuitGoal,
  type ReplyStyle
} from "../../pursuit/src/index.js";
import { exportPersonaPack, exportPersonaPackZipToFile, exportTargets, type ExportTarget } from "../../exporters/src/index.js";
import { parseMediaFile } from "../../media/src/index.js";
import { startKskillServer } from "../../server/src/index.js";
import { synthesizeSpeech, transcribeAudio, voicePreviewManifest, type VoiceProviderId } from "../../voice/src/index.js";

const program = new Command();

type LlmOptions = {
  provider?: DistillProviderName;
  model?: string;
  baseUrl?: string;
  timeoutMs?: string;
  maxRetries?: string;
  requireLlm?: boolean;
};

function readStdinIfAvailable(): Promise<string> {
  return new Promise((resolvePromise) => {
    if (process.stdin.isTTY) {
      resolvePromise("");
      return;
    }
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolvePromise(data));
  });
}

function parseLlmOptions(options: LlmOptions) {
  return {
    provider: options.provider ?? "none",
    model: options.model,
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs ? Number(options.timeoutMs) : undefined,
    maxRetries: options.maxRetries ? Number(options.maxRetries) : undefined,
    requireLlm: options.requireLlm ?? false
  };
}

async function distillWithOptions(pack: PersonaPack, source: ParsedSource, options: LlmOptions): Promise<PersonaPack> {
  if (!options.provider || options.provider === "none") {
    return distillPersonaPack(pack, source);
  }
  const result = await distillPersonaPackAsync(pack, source, parseLlmOptions(options));
  return result.pack;
}

function runNpmScript(script: string): Promise<number> {
  return new Promise((resolvePromise) => {
    const child = spawn("npm", ["run", script], { stdio: "inherit", shell: true });
    child.on("exit", (code) => resolvePromise(code ?? 1));
  });
}

function printJsonOrText(value: unknown, text: string, json?: boolean): void {
  if (json) console.log(JSON.stringify(value, null, 2));
  else console.log(text);
}

program
  .name("kskill")
  .description("K.skill Persona Pack OS CLI")
  .version("0.1.0");

program
  .command("init")
  .description("Create a new persona pack")
  .argument("[name]", "persona name", "my-persona")
  .option("-t, --type <type>", "relationship | character | advisor | self | pursuit", "relationship")
  .option("-l, --language <lang>", "zh | en | ja | ko | es", "zh")
  .option("-o, --out <dir>", "output directory")
  .action((name: string, options: { type: PersonaType; language: PackLanguage; out?: string }) => {
    const outDir = resolve(options.out ?? slugify(name));
    const pack = createPersonaPack({ name, type: options.type, language: options.language });
    savePack(outDir, pack);
    console.log(`Created persona pack at ${outDir}`);
  });

program
  .command("import")
  .description("Import a source file into a persona pack")
  .argument("<file>", "chat, markdown, html, json, csv, or character card")
  .option("-p, --pack <dir>", "existing pack directory")
  .option("-t, --type <type>", "relationship | character | advisor | self | pursuit", "relationship")
  .option("-n, --name <name>", "name for a new pack")
  .option("--preview", "only parse and print import preview")
  .option("--format <format>", "wechat | qq | imessage | telegram | whatsapp | markdown | sillytavern")
  .option("--provider <provider>", "none | openai-compatible | deepseek | anthropic-compatible | ollama", "none")
  .option("--media", "parse audio, image, sticker, PDF, video transcript, or mixed media input")
  .option("--model <model>", "model name")
  .option("--base-url <url>", "OpenAI-compatible or Ollama base URL")
  .option("--timeout-ms <ms>", "LLM timeout in milliseconds")
  .option("--max-retries <n>", "LLM retry count")
  .option("--require-llm", "fail instead of falling back when LLM distillation fails")
  .action(async (file: string, options: { pack?: string; type: PersonaType; name?: string; preview?: boolean; format?: string; media?: boolean } & LlmOptions) => {
    const mediaResult = options.media
      ? await parseMediaFile({ name: file, bytes: new Uint8Array(readFileSync(file)) }, { consentConfirmed: false, asr: { providerId: options.provider as VoiceProviderId, language: "zh" } })
      : undefined;
    const source = mediaResult?.sources[0] ?? parseSourceFromFile(file, { type: options.type, consentConfirmed: false });
    if (options.preview) {
      const preview = options.media ? mediaResult : parseImport({ name: file, text: source.text, forcedFormat: options.format });
      console.log(JSON.stringify(preview, null, 2));
      return;
    }
    const packDir = resolve(options.pack ?? slugify(options.name ?? file.replace(/\.[^.]+$/, "")));
    const pack = existsSync(join(packDir, "persona.yaml"))
      ? loadPack(packDir)
      : createPersonaPack({ name: options.name ?? file, type: options.type, language: source.source.language });
    const distilledBase = await distillWithOptions(pack, source, options.media ? { ...options, provider: "none" } : options);
    const distilled: PersonaPack = mediaResult?.assets.length
      ? { ...distilledBase, assets: [...distilledBase.assets, ...mediaResult.assets.map((item) => item.asset)] }
      : distilledBase;
    savePack(packDir, distilled);
    writeTextFile(join(packDir, "sources", `${source.source.id}.txt`), source.text);
    console.log(`Imported ${file} into ${packDir}`);
  });

program
  .command("transcribe")
  .description("Transcribe an audio or transcript sidecar file with a provider-neutral ASR adapter")
  .argument("<file>", "audio file, transcript JSON, or VTT sidecar")
  .option("--provider <provider>", "stub-asr | local-whisper | openai-compatible-asr", "stub-asr")
  .option("-l, --language <lang>", "zh | en | ja | ko | es", "zh")
  .option("-o, --out <file>", "output JSON path")
  .action(async (file: string, options: { provider: VoiceProviderId; language: PackLanguage; out?: string }) => {
    const result = await transcribeAudio({ bytes: new Uint8Array(readFileSync(file)), filename: file, mimeType: "application/octet-stream" }, {
      providerId: options.provider,
      language: options.language,
      timestamps: "segment"
    });
    const out = resolve(options.out ?? "transcript.json");
    writeJsonFile(out, result);
    console.log(`Transcribed ${file} -> ${out}`);
  });

program
  .command("speak")
  .description("Generate a deterministic TTS preview for a persona pack or text")
  .argument("<pack>", "pack directory")
  .requiredOption("--text <text>", "text to synthesize")
  .option("--provider <provider>", "stub-tts | local-piper | local-command-tts | local-voice-clone | openai-compatible-tts", "stub-tts")
  .option("--voice <voice>", "voice id")
  .option("--reference-audio <file>", "reference audio path for local voice clone engines")
  .option("--voice-profile <file>", "voice profile path for local voice clone engines")
  .option("--timeout-ms <ms>", "local voice engine timeout in milliseconds")
  .option("-o, --out <file>", "output audio path", "preview.wav")
  .action(async (packDir: string, options: { text: string; provider: VoiceProviderId; voice?: string; referenceAudio?: string; voiceProfile?: string; timeoutMs?: string; out: string }) => {
    const pack = loadPack(resolve(packDir));
    const audio = await synthesizeSpeech(options.text, {
      providerId: options.provider,
      ...(options.voice ? { voice: options.voice } : {}),
      ...(options.referenceAudio ? { referenceAudioPath: resolve(options.referenceAudio) } : {}),
      ...(options.voiceProfile ? { voiceProfilePath: resolve(options.voiceProfile) } : {}),
      ...(options.timeoutMs ? { timeoutMs: Number(options.timeoutMs) } : {}),
      language: pack.language,
      format: "wav"
    });
    writeFileSync(resolve(options.out), audio.bytes);
    writeJsonFile(`${resolve(options.out)}.manifest.json`, voicePreviewManifest(audio, pack.language, pack.id));
    console.log(`Wrote TTS preview to ${resolve(options.out)}`);
  });

program
  .command("voice-profile")
  .description("Print the Voice DNA profile for a persona pack")
  .argument("<pack>", "pack directory")
  .action((packDir: string) => {
    const pack = loadPack(resolve(packDir));
    console.log(JSON.stringify({ voiceProfile: pack.voiceProfile, stickerIntents: pack.stickerIntents, assets: pack.assets }, null, 2));
  });

program
  .command("distill")
  .description("Distill an existing persona pack and refresh generated summaries")
  .argument("<pack>", "pack directory")
  .option("--provider <provider>", "none | openai-compatible | deepseek | anthropic-compatible | ollama", "none")
  .option("--model <model>", "model name")
  .option("--base-url <url>", "OpenAI-compatible or Ollama base URL")
  .option("--timeout-ms <ms>", "LLM timeout in milliseconds")
  .option("--max-retries <n>", "LLM retry count")
  .option("--require-llm", "fail instead of falling back when LLM distillation fails")
  .action(async (packDir: string, options: LlmOptions) => {
    const pack = loadPack(resolve(packDir));
    if (options.provider && options.provider !== "none" && pack.sources[0]) {
      const source = parseSourceFromFile(join(resolve(packDir), "sources", `${pack.sources[0].id}.txt`), { consentConfirmed: pack.sources[0].consentConfirmed });
      const next = await distillWithOptions(pack, source, options);
      savePack(resolve(packDir), next);
      console.log(renderDistillationSummary(next));
      return;
    }
    savePack(resolve(packDir), pack);
    console.log(renderDistillationSummary(pack));
  });

program
  .command("pursue")
  .description("Analyze chat logs for respectful Crush Coach / 我要追TA guidance")
  .argument("<file>", "chat log file")
  .option("--me <name>", "your speaker name", "我")
  .option("--ta <name>", "target speaker name", "TA")
  .option("-g, --goal <goal>", "break_ice | continue_chat | ask_out | judge_chance | recover_cold_chat | write_reply", "judge_chance")
  .option("--latest <message>", "TA's latest message")
  .option("--draft <message>", "draft you are considering sending")
  .option("--max-turns <n>", "latest turns to include", "10")
  .option("--json", "print JSON")
  .option("-o, --out <dir>", "output directory", "pursuit-output")
  .action((file: string, options: { me: string; ta: string; goal: PursuitGoal; out: string; latest?: string; draft?: string; maxTurns: string; json?: boolean }) => {
    const source = parseSourceFromFile(file);
    const report = analyzePursuit(source.messages, {
      userName: options.me,
      targetName: options.ta,
      goal: options.goal,
      language: source.source.language,
      latestMessage: options.latest,
      draftMessage: options.draft,
      maxTurns: Number(options.maxTurns)
    });
    const outDir = resolve(options.out);
    writeTextFile(join(outDir, "pursuit_report.md"), renderPursuitReport(report));
    writeTextFile(join(outDir, "topic_plan.md"), generateTopicPlan(report).markdown);
    writeJsonFile(join(outDir, "pursuit_report.json"), report);
    printJsonOrText(report, renderPursuitReport(report), options.json);
  });

program
  .command("reply")
  .description("Generate boundary-safe replies for TA's latest message")
  .argument("<file>", "chat log file")
  .requiredOption("--latest <message>", "TA's latest message")
  .option("--me <name>", "your speaker name", "我")
  .option("--ta <name>", "target speaker name", "TA")
  .option("-s, --style <style>", "natural | humorous | sincere | restrained | direct | gentle", "natural")
  .option("--variants <items>", "safe,warm,invite")
  .option("--json", "print JSON")
  .action((file: string, options: { latest: string; me: string; ta: string; style: ReplyStyle; variants?: string; json?: boolean }) => {
    const source = parseSourceFromFile(file);
    const report = analyzePursuit(source.messages, { userName: options.me, targetName: options.ta, goal: "write_reply", language: source.source.language, latestMessage: options.latest });
    const replies = options.variants
      ? generateReplyLab(report, options.latest, options.style, options.variants.split(","))
      : generateReplySuggestions(report, options.latest, options.style);
    printJsonOrText(replies, renderReplies(replies), options.json);
  });

program
  .command("send-or-not")
  .description("Judge whether a draft should be sent under the boundary-safe Crush Coach policy")
  .argument("<file>", "chat log file")
  .requiredOption("--draft <message>", "draft you are considering sending")
  .option("--latest <message>", "TA's latest message")
  .option("--me <name>", "your speaker name", "我")
  .option("--ta <name>", "target speaker name", "TA")
  .option("--json", "print JSON")
  .action((file: string, options: { draft: string; latest?: string; me: string; ta: string; json?: boolean }) => {
    const source = parseSourceFromFile(file);
    const report = analyzePursuit(source.messages, {
      userName: options.me,
      targetName: options.ta,
      goal: "write_reply",
      language: source.source.language,
      latestMessage: options.latest,
      draftMessage: options.draft
    });
    const decision = assessSendDecision(report, options.draft);
    const text = `Decision: ${decision.kind}\nReason: ${decision.reason}\nSuggested rewrite: ${decision.suggestedRewrite ?? "none"}`;
    printJsonOrText(decision, text, options.json);
  });

program
  .command("topics")
  .description("Generate a respectful topic plan from a chat log")
  .argument("<file>", "chat log file")
  .option("--me <name>", "your speaker name", "我")
  .option("--ta <name>", "target speaker name", "TA")
  .action((file: string, options: { me: string; ta: string }) => {
    const source = parseSourceFromFile(file);
    const report = analyzePursuit(source.messages, { userName: options.me, targetName: options.ta, goal: "continue_chat", language: source.source.language });
    console.log(generateTopicPlan(report).markdown);
  });

program
  .command("memory")
  .description("Print memory state for a persona pack")
  .argument("<pack>", "pack directory")
  .action((packDir: string) => {
    const pack = loadPack(resolve(packDir));
    console.log(JSON.stringify(pack.memory, null, 2));
  });

program
  .command("inspect")
  .description("Inspect the prompt stack for a persona pack")
  .argument("<pack>", "pack directory")
  .action((packDir: string) => {
    const pack = loadPack(resolve(packDir));
    console.log(inspectPromptStack(pack).rendered);
  });

program
  .command("compile")
  .description("Export a persona pack to a target platform")
  .argument("<pack>", "pack directory")
  .requiredOption("--target <target>", `one of: ${exportTargets.join(", ")}`)
  .option("-o, --out <dir>", "output directory")
  .action((packDir: string, options: { target: ExportTarget; out?: string }) => {
    if (!exportTargets.includes(options.target)) {
      throw new Error(`Unsupported target ${options.target}. Use one of: ${exportTargets.join(", ")}`);
    }
    const pack = loadPack(resolve(packDir));
    const outDir = resolve(options.out ?? join(packDir, "exports", options.target));
    const result = exportPersonaPack(pack, { target: options.target, outDir });
    console.log(`${result.instructions}\n${result.files.map((file) => `- ${file}`).join("\n")}`);
  });

program
  .command("export-zip")
  .description("Export a persona pack as a validated zip bundle")
  .argument("<pack>", "pack directory")
  .requiredOption("--target <target>", `one of: ${exportTargets.join(", ")}`)
  .option("-o, --out <file>", "output zip path")
  .action((packDir: string, options: { target: ExportTarget; out?: string }) => {
    if (!exportTargets.includes(options.target)) {
      throw new Error(`Unsupported target ${options.target}. Use one of: ${exportTargets.join(", ")}`);
    }
    const pack = loadPack(resolve(packDir));
    const outFile = resolve(options.out ?? join(packDir, "exports", `${options.target}.zip`));
    const result = exportPersonaPackZipToFile(pack, { target: options.target, outFile });
    console.log(`${result.instructions}\n${outFile}`);
  });

program
  .command("eval")
  .description("Run built-in persona pack checks")
  .argument("<pack>", "pack directory")
  .action((packDir: string) => {
    const pack = loadPack(resolve(packDir));
    const validation = validatePersonaPack(pack);
    if (!validation.success) {
      console.error(validation.error.message);
      process.exitCode = 1;
      return;
    }
    const checks = [
      ["schema", true],
      ["has boundaries", pack.identity.boundaries.length > 0],
      ["has eval cases", pack.evals.length > 0],
      ["has prompt stack", inspectPromptStack(pack).layers.length >= 4]
    ] as const;
    for (const [name, pass] of checks) {
      console.log(`${pass ? "PASS" : "FAIL"} ${name}`);
      if (!pass) process.exitCode = 1;
    }
  });

program
  .command("serve")
  .description("Start the local Web GUI and API server")
  .option("-p, --port <port>", "port", "5999")
  .option("--vault <path>", "SQLite vault path")
  .option("--static-dir <dir>", "static web build directory", "dist-web")
  .action((options: { port: string; vault?: string; staticDir: string }) => {
    const serverOptions = {
      port: Number(options.port),
      staticDir: options.staticDir,
      ...(options.vault ? { vaultPath: resolve(options.vault) } : {})
    };
    const started = startKskillServer(serverOptions);
    console.log(`K.skill Web GUI running at ${started.url}`);
  });

program
  .command("verify")
  .description("Run the release quality gate")
  .action(async () => {
    const code = await runNpmScript("verify");
    process.exitCode = code;
  });

const maybeStdin = process.argv.length <= 2 ? await readStdinIfAvailable() : "";
if (maybeStdin.trim()) {
  const source = parseChatText(maybeStdin, { name: "stdin" });
  console.log(`Read ${source.messages.length} messages from stdin. Use a command such as pursue, import, reply, or send-or-not.`);
} else {
  await program.parseAsync(process.argv);
}
