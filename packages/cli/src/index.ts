#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { Command } from "commander";
import YAML from "yaml";
import {
  createPersonaPack,
  inspectPromptStack,
  renderPersonaMarkdown,
  slugify,
  validatePersonaPack,
  type PackLanguage,
  type PersonaPack,
  type PersonaType
} from "../../core/src/index.ts";
import { distillPersonaPack, renderDistillationSummary } from "../../distiller/src/index.ts";
import { parseCharacterCard, parseChatText, type ParsedSource } from "../../importers/src/index.ts";
import { analyzePursuit, generateReplySuggestions, generateTopicPlan, renderPursuitReport, renderReplies, type PursuitGoal, type ReplyStyle } from "../../pursuit/src/index.ts";
import { exportPersonaPack, exportTargets, type ExportTarget } from "../../exporters/src/index.ts";

const program = new Command();

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

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function writeJson(path: string, value: unknown): void {
  ensureDir(join(path, ".."));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(path: string, value: string): void {
  ensureDir(join(path, ".."));
  writeFileSync(path, value, "utf8");
}

function loadPack(packDir: string): PersonaPack {
  const path = join(packDir, "persona.yaml");
  if (!existsSync(path)) {
    throw new Error(`Persona pack not found: ${path}`);
  }
  const pack = YAML.parse(readFileSync(path, "utf8")) as PersonaPack;
  const validation = validatePersonaPack(pack);
  if (!validation.success) {
    throw new Error(`Invalid persona pack: ${validation.error.message}`);
  }
  return validation.data;
}

function savePack(packDir: string, pack: PersonaPack): void {
  ensureDir(packDir);
  writeText(join(packDir, "persona.yaml"), YAML.stringify(pack));
  writeText(join(packDir, "persona.md"), renderPersonaMarkdown(pack));
  writeJson(join(packDir, "memory", "state.json"), pack.memory);
  writeText(join(packDir, "memory", "episodes.jsonl"), pack.memory.episodes.map((episode) => JSON.stringify(episode)).join("\n") + "\n");
  writeText(join(packDir, "memory", "lorebook.json"), `${JSON.stringify(pack.memory.lorebook, null, 2)}\n`);
  writeText(join(packDir, "distillation", "evidence.jsonl"), pack.distillation.evidence.map((item) => JSON.stringify(item)).join("\n") + "\n");
  writeText(join(packDir, "distillation", "claims.jsonl"), pack.distillation.claims.map((item) => JSON.stringify(item)).join("\n") + "\n");
  writeText(join(packDir, "distillation", "contradictions.md"), pack.distillation.contradictions.map((item) => `- ${item}`).join("\n") || "- No contradictions recorded.\n");
  writeText(join(packDir, "distillation", "summary.md"), renderDistillationSummary(pack));
}

function parseSourceFromFile(path: string, type = "chat"): ParsedSource {
  const raw = readFileSync(path, "utf8");
  if (path.endsWith(".json") && (raw.includes("chara_card") || raw.includes("spec_version") || raw.includes("character_book"))) {
    return parseCharacterCard(raw, { name: basename(path) });
  }
  return parseChatText(raw, { name: basename(path), consentConfirmed: false });
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
  .option("-t, --type <type>", "relationship | character | advisor | self", "relationship")
  .option("-n, --name <name>", "name for a new pack")
  .action((file: string, options: { pack?: string; type: PersonaType; name?: string }) => {
    const source = parseSourceFromFile(file, options.type);
    const packDir = resolve(options.pack ?? slugify(options.name ?? basename(file, "." + file.split(".").pop())));
    const pack = existsSync(join(packDir, "persona.yaml"))
      ? loadPack(packDir)
      : createPersonaPack({ name: options.name ?? basename(file), type: options.type, language: source.source.language });
    const distilled = distillPersonaPack(pack, source);
    savePack(packDir, distilled);
    writeText(join(packDir, "sources", `${source.source.id}.txt`), source.text);
    console.log(`Imported ${file} into ${packDir}`);
  });

program
  .command("distill")
  .description("Distill an existing persona pack and refresh generated summaries")
  .argument("<pack>", "pack directory")
  .action((packDir: string) => {
    const pack = loadPack(resolve(packDir));
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
  .option("-o, --out <dir>", "output directory", "pursuit-output")
  .action((file: string, options: { me: string; ta: string; goal: PursuitGoal; out: string }) => {
    const source = parseSourceFromFile(file);
    const report = analyzePursuit(source.messages, { userName: options.me, targetName: options.ta, goal: options.goal, language: source.source.language });
    const outDir = resolve(options.out);
    ensureDir(outDir);
    writeText(join(outDir, "pursuit_report.md"), renderPursuitReport(report));
    writeText(join(outDir, "topic_plan.md"), generateTopicPlan(report).markdown);
    console.log(renderPursuitReport(report));
  });

program
  .command("reply")
  .description("Generate three boundary-safe replies for TA's latest message")
  .argument("<file>", "chat log file")
  .requiredOption("--latest <message>", "TA's latest message")
  .option("--me <name>", "your speaker name", "我")
  .option("--ta <name>", "target speaker name", "TA")
  .option("-s, --style <style>", "natural | humorous | sincere | restrained | direct | gentle", "natural")
  .action((file: string, options: { latest: string; me: string; ta: string; style: ReplyStyle }) => {
    const source = parseSourceFromFile(file);
    const report = analyzePursuit(source.messages, { userName: options.me, targetName: options.ta, goal: "write_reply", language: source.source.language });
    const replies = generateReplySuggestions(report, options.latest, options.style);
    console.log(renderReplies(replies));
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
    for (const [name, ok] of checks) {
      console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
      if (!ok) process.exitCode = 1;
    }
  });

program
  .command("serve")
  .description("Start the local Web GUI")
  .option("-p, --port <port>", "port", "5173")
  .action((options: { port: string }) => {
    const child = spawn("npm", ["run", "dev", "--", "--port", options.port], { stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      process.exitCode = code ?? 0;
    });
  });

const maybeStdin = await readStdinIfAvailable();
if (maybeStdin.trim() && process.argv.length <= 2) {
  const source = parseChatText(maybeStdin, { name: "stdin" });
  console.log(`Read ${source.messages.length} messages from stdin. Use a command such as pursue, import, or reply.`);
} else {
  await program.parseAsync(process.argv);
}
