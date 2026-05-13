import { parse as parseCsvRecords } from "csv-parse/sync";
import {
  createId,
  nowIso,
  stableHash,
  type MediaAsset,
  type MessageAttachment,
  type MessageReaction,
  type PackLanguage,
  type Source,
  type Transcript
} from "../../core/src/index.js";

export type ChatMessage = {
  id: string;
  speaker: string;
  text: string;
  raw: string;
  timestamp?: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  transcripts?: Transcript[];
};

export type ParsedSource = {
  source: Source;
  messages: ChatMessage[];
  text: string;
  assets?: MediaAsset[];
};

export type ParseChatOptions = {
  name?: string | undefined;
  language?: PackLanguage | undefined;
  private?: boolean | undefined;
  consentConfirmed?: boolean | undefined;
};

export type ImportFormat =
  | "wechat"
  | "qq"
  | "imessage"
  | "telegram"
  | "whatsapp"
  | "markdown"
  | "json"
  | "html"
  | "sillytavern_character_card_v2"
  | "lorebook"
  | "text";

export type ParseDiagnosticSeverity = "info" | "warning" | "error" | "fatal";

export type ParseDiagnostic = {
  severity: ParseDiagnosticSeverity;
  code: string;
  message: string;
  path?: string;
};

export type ImportPreview = {
  detectedFormat: ImportFormat;
  confidence: number;
  messageCount: number;
  speakers: string[];
  language: PackLanguage;
  diagnostics: ParseDiagnostic[];
  timeRange?: {
    start: string;
    end: string;
  };
};

export type ImportedCharacter = {
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  firstMessage?: string;
  messageExample?: string;
  creatorNotes?: string;
  systemPrompt?: string;
  postHistoryInstructions?: string;
  tags?: string[];
  alternateGreetings?: string[];
};

export type LorebookEntry = {
  keys: string[];
  content: string;
  priority: number;
  comment?: string;
  enabled?: boolean;
  selective?: boolean;
  secondaryKeys?: string[];
};

export type ParsedImport = ParsedSource & {
  format: ImportFormat;
  preview: ImportPreview;
  character?: ImportedCharacter;
  lorebookEntries?: LorebookEntry[];
};

export type ParseImportInput = ParseChatOptions & {
  text: string;
  forcedFormat?: ImportFormat | "sillytavern" | string | undefined;
};

export type ParseResult =
  | {
      ok: true;
      import: ParsedImport;
      diagnostics: ParseDiagnostic[];
    }
  | {
      ok: false;
      diagnostics: ParseDiagnostic[];
      error: string;
      import?: ParsedImport;
    };

type MessageSeed = {
  speaker: string;
  text: string;
  raw: string;
  timestamp?: string;
};

type ImportParserOutput = {
  text: string;
  messages: MessageSeed[];
  sourceType?: Source["type"];
  character?: ImportedCharacter;
  lorebookEntries?: LorebookEntry[];
};

type ImportParserContext = {
  input: ParseImportInput;
  diagnostics: ParseDiagnostic[];
};

export type ImportParser = {
  format: ImportFormat;
  sourceType: Source["type"];
  detect: (input: ParseImportInput) => number;
  parse: (raw: string, context: ImportParserContext) => ImportParserOutput;
};

const timestampSpeakerPatterns = [
  /^\[?(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}(?:日)?(?:[ T]\d{1,2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)?[^\]]*?)\]?\s+([^:：]+)[:：]\s*(.*)$/,
  /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([^:：]+)[:：]\s*(.*)$/
];

const whatsappLinePattern =
  /^\[?(\d{1,2}[/.]\d{1,2}[/.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?\s+-\s+([^:]+):\s?(.*)$/i;

const qqHeaderPattern =
  /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+(.+?)(?:\s*[\(<（][^)）>]+[\)>）])?\s*$/;

function detectLanguage(text: string): PackLanguage {
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u4e00-\u9fa5]/.test(text)) return "zh";
  if (/[¿¡ñáéíóú]/i.test(text)) return "es";
  return "en";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function stringArrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => stringValue(item)).filter((item): item is string => Boolean(item));
  const single = stringValue(value);
  return single ? [single] : [];
}

function lowerName(input: Pick<ParseImportInput, "name">): string {
  return (input.name ?? "").toLowerCase();
}

function extensionLooksLike(name: string, extension: string): boolean {
  return name.endsWith(extension) || name.includes(`${extension}.`);
}

function tryParseJson(raw: string): unknown | undefined {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function parseJsonWithDiagnostics(raw: string, diagnostics: ParseDiagnostic[], format: ImportFormat): unknown | undefined {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    diagnostics.push({
      severity: "error",
      code: "invalid_json",
      message: `Could not parse ${format} JSON: ${error instanceof Error ? error.message : "invalid JSON"}`
    });
    return undefined;
  }
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'"
  };
  const decodeCodePoint = (raw: string, radix: number, fallback: string) => {
    const codePoint = Number.parseInt(raw, radix);
    if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return fallback;
    return String.fromCodePoint(codePoint);
  };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (match, hex: string) => decodeCodePoint(hex, 16, match))
    .replace(/&#(\d+);/g, (match, decimal: string) => decodeCodePoint(decimal, 10, match))
    .replace(/&([a-z]+);/gi, (match, name: string) => namedEntities[name.toLowerCase()] ?? match);
}

function collapseTextLines(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function stripHtml(value: string): string {
  const withBreaks = value
    .replace(/<\s*(br|hr)\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*(p|div|li|tr|h[1-6])(?:\s[^>]*)?>/gi, "\n")
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return collapseTextLines(decodeHtmlEntities(withBreaks));
}

function normalizeSpeaker(value: string | undefined): string {
  const speaker = (value ?? "unknown")
    .replace(/\s*[\(<（][^)）>]+[\)>）]\s*$/u, "")
    .replace(/^@+/, "")
    .trim();
  return speaker || "unknown";
}

function makeSeed(speaker: string, text: string, raw: string, timestamp?: string): MessageSeed {
  const seed: MessageSeed = {
    speaker: normalizeSpeaker(speaker),
    text: text.trim(),
    raw: raw.trim()
  };
  const cleanedTimestamp = timestamp?.trim();
  if (cleanedTimestamp) seed.timestamp = cleanedTimestamp;
  return seed;
}

function formatSeed(seed: MessageSeed): string {
  const prefix = seed.timestamp ? `${seed.timestamp} ${seed.speaker}` : seed.speaker;
  return `${prefix}: ${seed.text}`.trim();
}

function parseLineToSeed(line: string): MessageSeed {
  let timestamp: string | undefined;
  let speaker = "unknown";
  let text = line;

  for (const pattern of timestampSpeakerPatterns) {
    const match = line.match(pattern);
    if (match) {
      timestamp = match[1]?.trim();
      speaker = match[2]?.trim() || "unknown";
      text = match[3]?.trim() || "";
      break;
    }
  }

  if (speaker === "unknown") {
    const simple = line.match(/^([^:：]{1,64})[:：]\s*(.*)$/);
    if (simple) {
      speaker = simple[1]?.trim() || "unknown";
      text = simple[2]?.trim() || "";
    }
  }

  return makeSeed(speaker, text, line, timestamp);
}

function parseTextLines(raw: string): MessageSeed[] {
  const lines = collapseTextLines(raw).split("\n").filter(Boolean);
  return lines.map((line) => parseLineToSeed(line));
}

function toChatMessage(seed: MessageSeed, sourceId: string, index: number): ChatMessage {
  const message: ChatMessage = {
    id: createId("msg", `${sourceId}:${index}:${seed.raw || seed.text}`),
    speaker: seed.speaker,
    text: seed.text,
    raw: seed.raw
  };
  if (seed.timestamp) message.timestamp = seed.timestamp;
  return message;
}

function uniqueSpeakers(messages: ChatMessage[]): string[] {
  const speakers: string[] = [];
  for (const message of messages) {
    if (!speakers.includes(message.speaker)) speakers.push(message.speaker);
  }
  return speakers;
}

function timeRange(messages: ChatMessage[]): ImportPreview["timeRange"] | undefined {
  const timestamps = messages.map((message) => message.timestamp).filter((item): item is string => Boolean(item));
  if (!timestamps.length) return undefined;
  return {
    start: timestamps[0] ?? "",
    end: timestamps[timestamps.length - 1] ?? timestamps[0] ?? ""
  };
}

function pickRecordValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }

  const entries = Object.entries(record);
  for (const key of keys) {
    const lower = key.toLowerCase();
    const match = entries.find(([candidate]) => candidate.toLowerCase() === lower);
    if (match) return match[1];
  }

  return undefined;
}

function textFromPayload(value: unknown): string {
  const direct = stringValue(value);
  if (direct) return direct;

  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        const record = asRecord(part);
        if (!record) return "";
        return textFromPayload(pickRecordValue(record, ["text", "content", "message", "value"]));
      })
      .filter(Boolean)
      .join("");
  }

  const record = asRecord(value);
  if (record) return textFromPayload(pickRecordValue(record, ["text", "content", "message", "value"]));

  return "";
}

function seedFromRecord(record: Record<string, unknown>, fallbackIndex: number): MessageSeed | undefined {
  const speaker =
    stringValue(pickRecordValue(record, ["speaker", "sender", "from", "author", "role", "name", "handle", "handle_id"])) ??
    "unknown";
  const text = textFromPayload(pickRecordValue(record, ["text", "message", "content", "body", "value"]));
  const timestamp = stringValue(pickRecordValue(record, ["timestamp", "date", "time", "datetime", "created_at", "createdAt"]));

  if (!text && speaker === "unknown" && !timestamp) return undefined;

  return makeSeed(speaker, text, `${timestamp ? `${timestamp} ` : ""}${speaker}: ${text || `[message ${fallbackIndex + 1}]`}`, timestamp);
}

function extractJsonMessageSeeds(value: unknown): MessageSeed[] {
  const candidateArrays: unknown[] = [];
  const rootRecord = asRecord(value);

  if (Array.isArray(value)) candidateArrays.push(value);
  if (rootRecord) {
    for (const key of ["messages", "chat", "items", "conversation", "data"]) {
      const candidate = rootRecord[key];
      if (Array.isArray(candidate)) candidateArrays.push(candidate);
    }
  }

  for (const candidate of candidateArrays) {
    const seeds = asArray(candidate)
      ?.map((item, index) => {
        const record = asRecord(item);
        if (record) return seedFromRecord(record, index);
        const text = textFromPayload(item);
        return text ? makeSeed("unknown", text, text) : undefined;
      })
      .filter((item): item is MessageSeed => Boolean(item));
    if (seeds?.length) return seeds;
  }

  return [];
}

function parseJsonChat(raw: string): string {
  const data = tryParseJson(raw);
  if (data === undefined) return raw;
  const seeds = extractJsonMessageSeeds(data);
  return seeds.length ? seeds.map(formatSeed).join("\n") : raw;
}

function readCsvRows(raw: string, diagnostics?: ParseDiagnostic[]): Record<string, unknown>[] {
  try {
    return parseCsvRecords(raw, {
      bom: true,
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, unknown>[];
  } catch (error) {
    diagnostics?.push({
      severity: "error",
      code: "invalid_csv",
      message: `Could not parse CSV: ${error instanceof Error ? error.message : "invalid CSV"}`
    });
    return [];
  }
}

function parseCsvMessageSeeds(raw: string, diagnostics?: ParseDiagnostic[]): MessageSeed[] {
  const rows = readCsvRows(raw, diagnostics);
  return rows
    .map((row, index) => seedFromRecord(row, index))
    .filter((item): item is MessageSeed => Boolean(item));
}

function parseCsvChat(raw: string): string {
  const seeds = parseCsvMessageSeeds(raw);
  return seeds.length ? seeds.map(formatSeed).join("\n") : raw;
}

export function normalizeImportedText(raw: string, name = "chat.txt"): string {
  const normalizedName = name.toLowerCase();
  if (normalizedName.endsWith(".html") || /<\/?[a-z][\s\S]*>/i.test(raw)) return stripHtml(raw);
  if (normalizedName.endsWith(".json")) return parseJsonChat(raw);
  if (normalizedName.endsWith(".csv")) return parseCsvChat(raw);
  return collapseTextLines(raw);
}

function parseWhatsAppText(raw: string): MessageSeed[] {
  const seeds: MessageSeed[] = [];
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (const line of lines) {
    const match = line.match(whatsappLinePattern);
    if (match) {
      const timestamp = `${match[1] ?? ""} ${match[2] ?? ""}`.trim();
      seeds.push(makeSeed(match[3] ?? "unknown", match[4] ?? "", line, timestamp));
      continue;
    }

    const last = seeds[seeds.length - 1];
    if (last && line.trim()) {
      last.text = `${last.text}\n${line.trim()}`.trim();
      last.raw = `${last.raw}\n${line}`.trim();
    }
  }

  return seeds;
}

function parseQqText(raw: string): MessageSeed[] {
  const seeds: MessageSeed[] = [];
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let active: { timestamp: string; speaker: string; lines: string[]; rawLines: string[] } | undefined;

  const flush = () => {
    if (!active) return;
    const text = collapseTextLines(active.lines.join("\n"));
    if (text) seeds.push(makeSeed(active.speaker, text, active.rawLines.join("\n"), active.timestamp));
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^消息对象[:：]/.test(trimmed) || /^消息分组[:：]/.test(trimmed)) continue;
    const header = trimmed.match(qqHeaderPattern);
    if (header && !trimmed.includes(": ")) {
      flush();
      active = {
        timestamp: header[1] ?? "",
        speaker: normalizeSpeaker(header[2]),
        lines: [],
        rawLines: [line]
      };
      continue;
    }
    if (active) {
      active.lines.push(line);
      active.rawLines.push(line);
    }
  }

  flush();
  return seeds.length ? seeds : parseTextLines(raw);
}

function parseSillyTavernCharacter(value: unknown): ImportedCharacter | undefined {
  const root = asRecord(value);
  const data = asRecord(root?.data) ?? root;
  if (!data) return undefined;

  const name = stringValue(data.name ?? root?.name);
  if (!name) return undefined;

  const character: ImportedCharacter = { name };
  const fields: Array<[keyof ImportedCharacter, unknown]> = [
    ["description", data.description],
    ["personality", data.personality],
    ["scenario", data.scenario],
    ["firstMessage", data.first_mes ?? data.firstMessage],
    ["messageExample", data.mes_example ?? data.messageExample],
    ["creatorNotes", data.creator_notes ?? data.creatorNotes],
    ["systemPrompt", data.system_prompt ?? data.systemPrompt],
    ["postHistoryInstructions", data.post_history_instructions ?? data.postHistoryInstructions]
  ];

  for (const [key, valueForKey] of fields) {
    const text = stringValue(valueForKey);
    if (text) {
      (character as Record<string, unknown>)[key] = text;
    }
  }

  const tags = stringArrayValue(data.tags);
  if (tags.length) character.tags = tags;
  const alternateGreetings = stringArrayValue(data.alternate_greetings ?? data.alternateGreetings);
  if (alternateGreetings.length) character.alternateGreetings = alternateGreetings;

  return character;
}

function lorebookEntryFromRecord(record: Record<string, unknown>): LorebookEntry | undefined {
  const keys = stringArrayValue(record.keys ?? record.key ?? record.constant_key);
  const secondaryKeys = stringArrayValue(record.secondary_keys ?? record.secondaryKeys);
  const content = stringValue(record.content ?? record.text ?? record.entry);
  if (!keys.length || !content) return undefined;

  const priorityValue = stringValue(record.priority ?? record.order ?? record.insertion_order ?? record.insertionOrder);
  const priority = priorityValue && Number.isFinite(Number(priorityValue)) ? Number(priorityValue) : 0;
  const entry: LorebookEntry = { keys, content, priority };

  const comment = stringValue(record.comment ?? record.name);
  if (comment) entry.comment = comment;
  if (typeof record.enabled === "boolean") entry.enabled = record.enabled;
  if (typeof record.selective === "boolean") entry.selective = record.selective;
  if (secondaryKeys.length) entry.secondaryKeys = secondaryKeys;

  return entry;
}

function extractLorebookEntries(value: unknown): LorebookEntry[] {
  const root = asRecord(value);
  const candidates: unknown[] = [];

  if (Array.isArray(value)) candidates.push(value);
  if (root) {
    const data = asRecord(root.data);
    const characterBook = asRecord(data?.character_book ?? root.character_book ?? root.characterBook);
    const worldInfo = asRecord(root.world_info ?? root.worldInfo);
    for (const candidate of [
      root.entries,
      root.lorebook,
      root.lore,
      characterBook?.entries,
      worldInfo?.entries,
      data?.entries
    ]) {
      if (candidate !== undefined) candidates.push(candidate);
    }
  }

  const entries: LorebookEntry[] = [];
  for (const candidate of candidates) {
    const values = Array.isArray(candidate) ? candidate : Object.values(asRecord(candidate) ?? {});
    for (const item of values) {
      const record = asRecord(item);
      if (!record) continue;
      const entry = lorebookEntryFromRecord(record);
      if (entry) entries.push(entry);
    }
  }

  return entries;
}

function isSillyTavernCardV2(value: unknown): boolean {
  const root = asRecord(value);
  const data = asRecord(root?.data);
  const spec = stringValue(root?.spec ?? root?.spec_version)?.toLowerCase();
  return Boolean(spec?.includes("chara_card_v2") || (spec === "2.0" && data?.name));
}

function looksLikeHtml(raw: string, name: string): boolean {
  return extensionLooksLike(name, ".html") || /<\/?(html|body|p|div|span|br|strong|b|li|tr|td)\b/i.test(raw);
}

function looksLikeJson(raw: string, name: string): boolean {
  return extensionLooksLike(name, ".json") || /^[\s\n]*[\[{]/.test(raw);
}

function csvHeader(raw: string): string[] {
  const first = raw.split(/\r?\n/, 1)[0] ?? "";
  return first.split(",").map((value) => value.trim().replace(/^"|"$/g, "").toLowerCase());
}

function hasSpeakerLines(raw: string): boolean {
  return parseTextLines(raw).some((seed) => seed.speaker !== "unknown");
}

const wechatParser: ImportParser = {
  format: "wechat",
  sourceType: "chat",
  detect(input) {
    const name = lowerName(input);
    if (name.includes("wechat") || name.includes("微信")) return 0.95;
    const matches = input.text.match(/^\d{4}[-/年]\d{1,2}[-/月]\d{1,2}.*?[^:：\n]{1,64}[:：].+$/gm);
    return matches && matches.length > 0 ? 0.88 : 0;
  },
  parse(raw) {
    const text = collapseTextLines(raw);
    return { text, messages: parseTextLines(text) };
  }
};

const qqParser: ImportParser = {
  format: "qq",
  sourceType: "chat",
  detect(input) {
    if (/消息对象[:：]/.test(input.text) || lowerName(input).includes("qq")) return 0.98;
    return qqHeaderPattern.test(input.text) ? 0.8 : 0;
  },
  parse(raw) {
    const messages = parseQqText(raw);
    return {
      text: messages.length ? messages.map(formatSeed).join("\n") : collapseTextLines(raw),
      messages
    };
  }
};

const whatsappParser: ImportParser = {
  format: "whatsapp",
  sourceType: "chat",
  detect(input) {
    if (lowerName(input).includes("whatsapp")) return 0.96;
    return whatsappLinePattern.test(input.text) ? 0.94 : 0;
  },
  parse(raw) {
    const messages = parseWhatsAppText(raw);
    return {
      text: messages.length ? messages.map(formatSeed).join("\n") : collapseTextLines(raw),
      messages
    };
  }
};

const telegramParser: ImportParser = {
  format: "telegram",
  sourceType: "json",
  detect(input) {
    const name = lowerName(input);
    const value = tryParseJson(input.text);
    const root = asRecord(value);
    const messages = asArray(root?.messages);
    if (messages?.some((item) => Boolean(asRecord(item)?.from ?? asRecord(item)?.date_unixtime))) return 0.96;
    if (name.includes("telegram") && looksLikeJson(input.text, name)) return 0.9;
    return 0;
  },
  parse(raw, context) {
    const value = parseJsonWithDiagnostics(raw, context.diagnostics, "telegram");
    const messages = extractJsonMessageSeeds(value);
    if (!messages.length) {
      context.diagnostics.push({
        severity: "warning",
        code: "telegram_no_messages",
        message: "Telegram JSON did not contain readable messages."
      });
    }
    return {
      text: messages.length ? messages.map(formatSeed).join("\n") : collapseTextLines(raw),
      messages: messages.length ? messages : parseTextLines(raw)
    };
  }
};

const imessageParser: ImportParser = {
  format: "imessage",
  sourceType: "csv",
  detect(input) {
    const name = lowerName(input);
    const header = csvHeader(input.text);
    const hasMessageColumns =
      header.some((item) => ["date", "timestamp", "time", "datetime"].includes(item)) &&
      header.some((item) => ["sender", "speaker", "from", "handle", "handle_id"].includes(item)) &&
      header.some((item) => ["text", "message", "content", "body"].includes(item));
    if (name.includes("imessage") || name.endsWith(".csv")) return hasMessageColumns ? 0.95 : 0.75;
    return hasMessageColumns ? 0.93 : 0;
  },
  parse(raw, context) {
    const messages = parseCsvMessageSeeds(raw, context.diagnostics);
    if (!messages.length) {
      context.diagnostics.push({
        severity: "warning",
        code: "csv_no_messages",
        message: "CSV did not contain readable message columns."
      });
    }
    return {
      text: messages.length ? messages.map(formatSeed).join("\n") : collapseTextLines(raw),
      messages: messages.length ? messages : parseTextLines(raw)
    };
  }
};

const markdownParser: ImportParser = {
  format: "markdown",
  sourceType: "markdown",
  detect(input) {
    const name = lowerName(input);
    if (name.endsWith(".md") || name.endsWith(".markdown")) return 0.9;
    if (/^\s{0,3}#{1,6}\s+/m.test(input.text) && hasSpeakerLines(input.text)) return 0.82;
    return 0;
  },
  parse(raw) {
    const text = collapseTextLines(raw);
    return { text, messages: parseTextLines(text) };
  }
};

const htmlParser: ImportParser = {
  format: "html",
  sourceType: "html",
  detect(input) {
    return looksLikeHtml(input.text, lowerName(input)) ? 0.9 : 0;
  },
  parse(raw) {
    const text = stripHtml(raw);
    return { text, messages: parseTextLines(text) };
  }
};

const sillyTavernCardParser: ImportParser = {
  format: "sillytavern_character_card_v2",
  sourceType: "character_card",
  detect(input) {
    const value = tryParseJson(input.text);
    if (isSillyTavernCardV2(value)) return 0.99;
    return 0;
  },
  parse(raw, context) {
    const value = parseJsonWithDiagnostics(raw, context.diagnostics, "sillytavern_character_card_v2");
    const character = parseSillyTavernCharacter(value);
    const lorebookEntries = extractLorebookEntries(value);
    if (!character) {
      context.diagnostics.push({
        severity: "warning",
        code: "character_card_missing_character",
        message: "Character card JSON did not contain a readable character name."
      });
    }
    return {
      text: raw,
      messages: [],
      sourceType: "character_card",
      ...(character ? { character } : {}),
      ...(lorebookEntries.length ? { lorebookEntries } : {})
    };
  }
};

const lorebookParser: ImportParser = {
  format: "lorebook",
  sourceType: "json",
  detect(input) {
    const name = lowerName(input);
    const value = tryParseJson(input.text);
    const entries = extractLorebookEntries(value);
    if (!entries.length) return 0;
    return name.includes("lorebook") || name.includes("world") ? 0.97 : 0.91;
  },
  parse(raw, context) {
    const value = parseJsonWithDiagnostics(raw, context.diagnostics, "lorebook");
    const lorebookEntries = extractLorebookEntries(value);
    if (!lorebookEntries.length) {
      context.diagnostics.push({
        severity: "warning",
        code: "lorebook_no_entries",
        message: "Lorebook JSON did not contain readable entries."
      });
    }
    return {
      text: raw,
      messages: [],
      lorebookEntries
    };
  }
};

const genericJsonParser: ImportParser = {
  format: "json",
  sourceType: "json",
  detect(input) {
    const name = lowerName(input);
    return looksLikeJson(input.text, name) ? 0.7 : 0;
  },
  parse(raw, context) {
    const value = parseJsonWithDiagnostics(raw, context.diagnostics, "json");
    const messages = value === undefined ? [] : extractJsonMessageSeeds(value);
    if (value !== undefined && !messages.length) {
      context.diagnostics.push({
        severity: "info",
        code: "json_no_messages",
        message: "JSON did not contain a messages array; imported as plain text."
      });
    }
    return {
      text: messages.length ? messages.map(formatSeed).join("\n") : collapseTextLines(raw),
      messages: messages.length ? messages : parseTextLines(raw)
    };
  }
};

const textParser: ImportParser = {
  format: "text",
  sourceType: "text",
  detect() {
    return 0.1;
  },
  parse(raw) {
    const text = collapseTextLines(raw);
    const messages = parseTextLines(text);
    return {
      text,
      messages,
      sourceType: messages.some((message) => message.speaker !== "unknown") ? "chat" : "text"
    };
  }
};

export const importParserRegistry: ImportParser[] = [
  sillyTavernCardParser,
  lorebookParser,
  telegramParser,
  imessageParser,
  qqParser,
  whatsappParser,
  wechatParser,
  htmlParser,
  markdownParser,
  genericJsonParser,
  textParser
];

export function registerImportParser(parser: ImportParser): void {
  importParserRegistry.push(parser);
}

function normalizeForcedFormat(format: string | undefined): ImportFormat | undefined {
  if (!format) return undefined;
  if (format === "sillytavern" || format === "character_card" || format === "character-card") {
    return "sillytavern_character_card_v2";
  }
  return importParserRegistry.some((parser) => parser.format === format) ? (format as ImportFormat) : undefined;
}

function selectParser(input: ParseImportInput, diagnostics: ParseDiagnostic[]): { parser: ImportParser; confidence: number } {
  const forcedFormat = normalizeForcedFormat(input.forcedFormat);
  if (forcedFormat) {
    const forcedParser = importParserRegistry.find((parser) => parser.format === forcedFormat);
    if (forcedParser) return { parser: forcedParser, confidence: 1 };
  } else if (input.forcedFormat) {
    diagnostics.push({
      severity: "warning",
      code: "unknown_forced_format",
      message: `Unknown forced import format "${input.forcedFormat}"; falling back to auto-detection.`
    });
  }

  let selected = textParser;
  let confidence = 0;

  for (const parser of importParserRegistry) {
    const detectedConfidence = parser.detect(input);
    if (detectedConfidence > confidence) {
      selected = parser;
      confidence = detectedConfidence;
    }
  }

  return { parser: selected, confidence };
}

function sourceTypeFor(parser: ImportParser, output: ImportParserOutput): Source["type"] {
  return output.sourceType ?? parser.sourceType;
}

function summaryFor(output: ImportParserOutput, fallback: string): string {
  const characterSummary = [output.character?.name, output.character?.description].filter(Boolean).join(": ");
  if (characterSummary) return characterSummary.slice(0, 240);
  if (output.lorebookEntries?.length) return output.lorebookEntries.map((entry) => `${entry.keys.join(", ")}: ${entry.content}`).join("\n").slice(0, 240);
  return (output.text || fallback).slice(0, 240);
}

function buildParsedImport(
  input: ParseImportInput,
  parser: ImportParser,
  confidence: number,
  output: ImportParserOutput,
  diagnostics: ParseDiagnostic[]
): ParsedImport {
  const sourceType = sourceTypeFor(parser, output);
  const textForLanguage = [
    output.text,
    output.character?.description,
    output.character?.personality,
    output.character?.scenario,
    ...(output.lorebookEntries?.map((entry) => entry.content) ?? [])
  ]
    .filter(Boolean)
    .join("\n");
  const language = input.language ?? detectLanguage(textForLanguage || input.text);
  const sourceId = createId("src", `${parser.format}:${input.name ?? "pasted"}:${stableHash(input.text)}`);
  const source: Source = {
    id: sourceId,
    name: input.name ?? "pasted-import",
    type: sourceType,
    language,
    private: input.private ?? (sourceType !== "character_card"),
    consentConfirmed: input.consentConfirmed ?? (sourceType === "character_card"),
    hash: stableHash(input.text),
    summary: summaryFor(output, input.text),
    importedAt: nowIso()
  };
  const messages = output.messages.map((message, index) => toChatMessage(message, sourceId, index));
  const range = timeRange(messages);
  const preview: ImportPreview = {
    detectedFormat: parser.format,
    confidence,
    messageCount: messages.length,
    speakers: uniqueSpeakers(messages),
    language,
    diagnostics,
    ...(range ? { timeRange: range } : {})
  };

  return {
    source,
    messages,
    text: output.text,
    format: parser.format,
    preview,
    ...(output.character ? { character: output.character } : {}),
    ...(output.lorebookEntries ? { lorebookEntries: output.lorebookEntries } : {})
  };
}

export function parseImport(input: ParseImportInput): ParseResult {
  const normalizedInput: ParseImportInput = {
    ...input,
    text: String(input.text ?? "")
  };
  const diagnostics: ParseDiagnostic[] = [];
  const { parser, confidence } = selectParser(normalizedInput, diagnostics);

  try {
    const output = parser.parse(normalizedInput.text, { input: normalizedInput, diagnostics });
    return {
      ok: true,
      import: buildParsedImport(normalizedInput, parser, confidence, output, diagnostics),
      diagnostics
    };
  } catch (error) {
    diagnostics.push({
      severity: "error",
      code: "parser_error",
      message: `Importer recovered from parser failure: ${error instanceof Error ? error.message : "unknown error"}`
    });
    const output = textParser.parse(normalizedInput.text, { input: normalizedInput, diagnostics });
    return {
      ok: true,
      import: buildParsedImport(normalizedInput, parser, confidence, output, diagnostics),
      diagnostics
    };
  }
}

export function parseChatText(raw: string, options: ParseChatOptions = {}): ParsedSource {
  const normalized = normalizeImportedText(raw, options.name);
  const language = options.language ?? detectLanguage(normalized);
  const sourceId = createId("src", `${options.name ?? "pasted"}:${stableHash(normalized)}`);
  const source: Source = {
    id: sourceId,
    name: options.name ?? "pasted-chat",
    type: "chat",
    language,
    private: options.private ?? true,
    consentConfirmed: options.consentConfirmed ?? false,
    hash: stableHash(normalized),
    summary: normalized.slice(0, 240),
    importedAt: nowIso()
  };

  const messages = parseTextLines(normalized).map((seed, index) => toChatMessage(seed, sourceId, index));
  return { source, messages, text: normalized };
}

export function parseCharacterCard(raw: string, options: ParseChatOptions = {}): ParsedSource {
  const parsed = tryParseJson(raw);
  const character = parseSillyTavernCharacter(parsed);
  const summary = (character ? [character.name, character.description].filter(Boolean).join(": ") : raw).slice(0, 240);
  const language = options.language ?? detectLanguage(summary || raw);
  const sourceId = createId("src", `character-card:${stableHash(raw)}`);

  return {
    source: {
      id: sourceId,
      name: options.name ?? "character-card",
      type: "character_card",
      language,
      private: options.private ?? false,
      consentConfirmed: options.consentConfirmed ?? true,
      hash: stableHash(raw),
      summary,
      importedAt: nowIso()
    },
    messages: [],
    text: raw
  };
}
