import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import YAML from "yaml";
import {
  renderPersonaMarkdown,
  slugify,
  validatePersonaPack,
  type PersonaPack,
  type PersonaType
} from "../../core/src/index.js";
import { renderDistillationSummary } from "../../distiller/src/index.js";
import { parseCharacterCard, parseChatText, parseImport, type ParsedSource } from "../../importers/src/index.js";

export type PackWriteOptions = {
  includeArtifacts?: boolean;
};

export type SourceReadOptions = {
  type?: PersonaType | "chat" | "character_card";
  consentConfirmed?: boolean;
  private?: boolean;
};

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function writeTextFile(path: string, value: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, value, "utf8");
}

export function writeJsonFile(path: string, value: unknown): void {
  writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function defaultPackDir(name: string): string {
  return resolve(slugify(name));
}

export function loadPack(packDir: string): PersonaPack {
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

export function savePack(packDir: string, pack: PersonaPack, options: PackWriteOptions = {}): void {
  const includeArtifacts = options.includeArtifacts ?? true;
  ensureDir(packDir);
  writeTextFile(join(packDir, "persona.yaml"), YAML.stringify(pack));
  writeTextFile(join(packDir, "persona.md"), renderPersonaMarkdown(pack));

  if (!includeArtifacts) return;

  writeJsonFile(join(packDir, "memory", "state.json"), pack.memory);
  writeTextFile(join(packDir, "memory", "episodes.jsonl"), pack.memory.episodes.map((episode) => JSON.stringify(episode)).join("\n") + "\n");
  writeJsonFile(join(packDir, "memory", "lorebook.json"), pack.memory.lorebook);
  writeTextFile(join(packDir, "distillation", "evidence.jsonl"), pack.distillation.evidence.map((item) => JSON.stringify(item)).join("\n") + "\n");
  writeTextFile(join(packDir, "distillation", "claims.jsonl"), pack.distillation.claims.map((item) => JSON.stringify(item)).join("\n") + "\n");
  writeTextFile(join(packDir, "distillation", "contradictions.md"), pack.distillation.contradictions.map((item) => `- ${item}`).join("\n") || "- No contradictions recorded.\n");
  writeTextFile(join(packDir, "distillation", "summary.md"), renderDistillationSummary(pack));
}

export function parseSourceFromText(text: string, name = "pasted-chat", options: SourceReadOptions = {}): ParsedSource {
  const importResult = parseImport({
    name,
    text,
    consentConfirmed: options.consentConfirmed,
    private: options.private
  });
  if (importResult.ok) {
    return {
      source: importResult.import.source,
      messages: importResult.import.messages,
      text: importResult.import.text
    };
  }
  return parseChatText(text, { name, consentConfirmed: options.consentConfirmed, private: options.private });
}

export function parseSourceFromFile(path: string, options: SourceReadOptions = {}): ParsedSource {
  const raw = readFileSync(path, "utf8");
  const name = basename(path);
  if ((options.type === "character_card" || extname(path) === ".json") && (raw.includes("chara_card") || raw.includes("spec_version") || raw.includes("character_book"))) {
    return parseCharacterCard(raw, { name, consentConfirmed: options.consentConfirmed, private: options.private });
  }
  return parseSourceFromText(raw, name, options);
}
