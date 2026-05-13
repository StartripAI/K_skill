import { createHash } from "node:crypto";
import { extname, basename } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { createId, nowIso, type MediaAsset, type MediaAssetKind, type PackLanguage } from "../../core/src/index.js";
import { parseImport, type ParsedImport, type ParsedSource } from "../../importers/src/index.js";
import { transcribeAudio, type AsrOptions, type AsrResult } from "../../voice/src/index.js";

export type MediaInputFile = {
  name: string;
  bytes: Uint8Array;
  mimeType?: string;
};

export type ParsedAsset = {
  asset: MediaAsset;
  bytes?: Uint8Array;
};

export type MediaParseDiagnostic = {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  path?: string;
};

export type MediaParseResult = {
  sources: ParsedSource[];
  assets: ParsedAsset[];
  diagnostics: MediaParseDiagnostic[];
  asrResults: AsrResult[];
};

const textDecoder = new TextDecoder("utf8", { fatal: false });

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sanitizeFilename(name: string): string {
  const safe = basename(name).replace(/[^a-zA-Z0-9._\-\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "media.bin";
}

export function classifyMediaFile(file: Pick<MediaInputFile, "name" | "mimeType">): { kind: MediaAssetKind | "text"; mimeType: string; textLike: boolean } {
  const name = file.name.toLowerCase();
  const extension = extname(name);
  const mimeType = file.mimeType || mimeFromExtension(extension);
  if (mimeType.startsWith("audio/")) return { kind: "audio", mimeType, textLike: false };
  if (mimeType.startsWith("video/")) return { kind: "video", mimeType, textLike: false };
  if (mimeType.startsWith("image/")) {
    const kind: MediaAssetKind = name.includes("sticker") || name.includes("emoji") ? "sticker" : "image";
    return { kind, mimeType, textLike: false };
  }
  if (mimeType === "application/pdf") return { kind: "pdf", mimeType, textLike: false };
  if (extension === ".vtt" || extension === ".srt") return { kind: "transcript", mimeType: "text/vtt", textLike: true };
  if (extension === ".zip") return { kind: "mixed", mimeType: "application/zip", textLike: false } as { kind: MediaAssetKind | "text"; mimeType: string; textLike: boolean };
  if (mimeType.startsWith("text/") || [".txt", ".md", ".json", ".csv", ".html", ".yaml", ".yml"].includes(extension)) {
    return { kind: "text", mimeType, textLike: true };
  }
  return { kind: "other", mimeType, textLike: false };
}

function mimeFromExtension(extension: string): string {
  const mimes: Record<string, string> = {
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
    ".csv": "text/csv",
    ".html": "text/html",
    ".htm": "text/html",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".vtt": "text/vtt"
  };
  return mimes[extension] ?? "application/octet-stream";
}

export function storageKeyFor(hash: string, filename: string): string {
  const extension = extname(filename) || ".bin";
  return `${hash.slice(0, 2)}/${hash}${extension}`;
}

export function createMediaAsset(file: MediaInputFile, sourceId: string, kind: MediaAssetKind, metadata: Record<string, unknown> = {}): MediaAsset {
  const filename = sanitizeFilename(file.name);
  const hash = sha256(file.bytes);
  const mimeType = file.mimeType || classifyMediaFile(file).mimeType;
  return {
    id: createId("asset", `${sourceId}:${hash}:${filename}`),
    kind,
    sourceId,
    filename,
    mimeType,
    byteLength: file.bytes.byteLength,
    sha256: hash,
    storageKey: storageKeyFor(hash, filename),
    metadata,
    createdAt: nowIso()
  };
}

function textSource(name: string, text: string, language?: PackLanguage): ParsedSource {
  const parsed = parseImport({ name, text, language });
  if (parsed.ok) return parsed.import;
  return parsed.import ?? parseImport({ name: `${name}.txt`, text: `media: ${text}` }).import!;
}

function transcriptSource(file: MediaInputFile, result: AsrResult, asset: MediaAsset): ParsedSource {
  const source = textSource(`${file.name}.transcript.txt`, result.text, result.language as PackLanguage | undefined);
  return {
    ...source,
    source: { ...source.source, type: "audio", name: file.name, summary: `Voice note transcript from ${file.name}` },
    messages: source.messages.map((message, index) => ({
      ...message,
      attachments: [{ id: createId("att", `${message.id}:${asset.id}`), assetId: asset.id, kind: asset.kind, label: file.name, text: result.text, role: "source" }],
      transcripts: [{
        id: result.transcriptId,
        assetId: asset.id,
        text: message.text,
        language: result.language as PackLanguage | undefined,
        confidence: result.confidence,
        provider: result.providerId,
        createdAt: nowIso(),
        segments: index === 0 ? result.segments : []
      }]
    })),
    assets: [asset]
  };
}

function mediaTextFor(file: MediaInputFile, kind: MediaAssetKind): string {
  if (kind === "image") return `media: Image or screenshot imported: ${sanitizeFilename(file.name)}`;
  if (kind === "sticker") return `media: Sticker imported: ${sanitizeFilename(file.name)}`;
  if (kind === "pdf") return `media: PDF imported: ${sanitizeFilename(file.name)}`;
  if (kind === "video") return `media: Video imported: ${sanitizeFilename(file.name)}. Add a transcript sidecar for richer evidence.`;
  return `media: ${kind} imported: ${sanitizeFilename(file.name)}`;
}

export async function parseMediaFile(file: MediaInputFile, options: { consentConfirmed?: boolean; private?: boolean; asr?: AsrOptions } = {}): Promise<MediaParseResult> {
  const diagnostics: MediaParseDiagnostic[] = [];
  const classified = classifyMediaFile(file);
  if (classified.textLike) {
    const rawText = textDecoder.decode(file.bytes);
    const text = classified.kind === "transcript" ? vttToPlainText(rawText) : rawText;
    const source = textSource(file.name, text);
    return {
      sources: [{
        ...source,
        source: {
          ...source.source,
          ...(classified.kind === "transcript" ? { type: "transcript" as const, summary: `Transcript imported from ${file.name}` } : {})
        }
      }],
      assets: [],
      diagnostics,
      asrResults: []
    };
  }
  if (classified.kind === "mixed" && classified.mimeType === "application/zip") {
    return parseMediaBundle(file, options);
  }

  const sourceId = createId("src", `${file.name}:${sha256(file.bytes)}`);
  const asset = createMediaAsset(file, sourceId, classified.kind === "text" ? "other" : classified.kind);
  if (classified.kind === "audio") {
    const asr = await transcribeAudio({ bytes: file.bytes, filename: file.name, mimeType: classified.mimeType }, options.asr);
    return { sources: [transcriptSource(file, asr, asset)], assets: [{ asset, bytes: file.bytes }], diagnostics, asrResults: [asr] };
  }
  const text = mediaTextFor(file, asset.kind);
  const source = textSource(`${file.name}.media.txt`, text);
  const messageId = source.messages[0]?.id;
  const attachedAsset = messageId ? { ...asset, messageId } : asset;
  return {
    sources: [{
      ...source,
      source: { ...source.source, type: asset.kind === "image" ? "image" : asset.kind === "sticker" ? "sticker" : asset.kind === "pdf" ? "pdf" : asset.kind === "video" ? "video" : "mixed", name: file.name, summary: text },
      messages: source.messages.map((message) => ({
        ...message,
        attachments: [{ id: createId("att", `${message.id}:${asset.id}`), assetId: asset.id, kind: asset.kind, label: file.name, text, role: asset.kind === "sticker" ? "sticker" : "visual" }]
      })),
      assets: [attachedAsset]
    }],
    assets: [{ asset: attachedAsset, bytes: file.bytes }],
    diagnostics,
    asrResults: []
  };
}

export async function parseMediaBundle(file: MediaInputFile, options: { consentConfirmed?: boolean; private?: boolean; asr?: AsrOptions } = {}): Promise<MediaParseResult> {
  const diagnostics: MediaParseDiagnostic[] = [];
  const sources: ParsedSource[] = [];
  const assets: ParsedAsset[] = [];
  const asrResults: AsrResult[] = [];
  try {
    const entries = unzipSync(file.bytes);
    for (const [name, bytes] of Object.entries(entries)) {
      if (name.endsWith("/")) continue;
      const result = await parseMediaFile({ name, bytes }, options);
      sources.push(...result.sources);
      assets.push(...result.assets);
      asrResults.push(...result.asrResults);
      diagnostics.push(...result.diagnostics);
    }
  } catch (error) {
    diagnostics.push({ severity: "error", code: "invalid_zip", message: error instanceof Error ? error.message : "Could not parse zip bundle", path: file.name });
  }
  return { sources, assets, diagnostics, asrResults };
}

export function vttToPlainText(raw: string): string {
  return strFromU8(new TextEncoder().encode(raw))
    .replace(/WEBVTT/i, "")
    .split(/\n/)
    .filter((line) => line.trim() && !line.includes("-->") && !/^\d+$/.test(line.trim()))
    .join("\n")
    .trim();
}
