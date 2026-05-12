import { createId, nowIso, stableHash, type PackLanguage, type Source } from "../../core/src/index.ts";

export type ChatMessage = {
  id: string;
  speaker: string;
  text: string;
  raw: string;
  timestamp?: string;
};

export type ParsedSource = {
  source: Source;
  messages: ChatMessage[];
  text: string;
};

export type ParseChatOptions = {
  name?: string;
  language?: PackLanguage;
  private?: boolean;
  consentConfirmed?: boolean;
};

const timestampSpeakerPatterns = [
  /^\[?(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[^\]]*?)\]?\s+([^:：]+)[:：]\s*(.+)$/,
  /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([^:：]+)[:：]\s*(.+)$/
];

function detectLanguage(text: string): PackLanguage {
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u4e00-\u9fa5]/.test(text)) return "zh";
  if (/[¿¡ñáéíóú]/i.test(text)) return "es";
  return "en";
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function parseJsonChat(raw: string): string {
  try {
    const data: unknown = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data
        .map((item) => {
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            const speaker = String(record.speaker ?? record.sender ?? record.from ?? record.role ?? "unknown");
            const text = String(record.text ?? record.message ?? record.content ?? "");
            return `${speaker}: ${text}`;
          }
          return String(item);
        })
        .join("\n");
    }
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (Array.isArray(record.messages)) {
        return parseJsonChat(JSON.stringify(record.messages));
      }
    }
  } catch {
    return raw;
  }
  return raw;
}

function parseCsvChat(raw: string): string {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(",").map((value) => value.trim().toLowerCase()) ?? [];
  const speakerIndex = Math.max(header.indexOf("speaker"), header.indexOf("sender"), header.indexOf("from"));
  const textIndex = Math.max(header.indexOf("text"), header.indexOf("message"), header.indexOf("content"));
  if (speakerIndex < 0 || textIndex < 0) return raw;

  return lines
    .map((line) => {
      const columns = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
      return `${columns[speakerIndex] ?? "unknown"}: ${columns[textIndex] ?? ""}`;
    })
    .join("\n");
}

export function normalizeImportedText(raw: string, name = "chat.txt"): string {
  if (name.endsWith(".html") || /<\/?[a-z][\s\S]*>/i.test(raw)) return stripHtml(raw);
  if (name.endsWith(".json")) return parseJsonChat(raw);
  if (name.endsWith(".csv")) return parseCsvChat(raw);
  return raw.replace(/\r\n/g, "\n").trim();
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

  const messages: ChatMessage[] = [];
  const lines = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
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
      const simple = line.match(/^([^:：]{1,32})[:：]\s*(.+)$/);
      if (simple) {
        speaker = simple[1]?.trim() || "unknown";
        text = simple[2]?.trim() || "";
      }
    }

    const message = {
      id: createId("msg", `${sourceId}:${messages.length}:${line}`),
      speaker,
      text,
      raw: line,
      ...(timestamp ? { timestamp } : {})
    };
    messages.push(message);
  }

  return { source, messages, text: normalized };
}

export function parseCharacterCard(raw: string, options: ParseChatOptions = {}): ParsedSource {
  const language = options.language ?? detectLanguage(raw);
  const sourceId = createId("src", `character-card:${stableHash(raw)}`);
  let summary = raw.slice(0, 240);
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    summary = String(parsed.description ?? parsed.data ?? parsed.name ?? summary).slice(0, 240);
  } catch {
    summary = raw.slice(0, 240);
  }
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
