import { createHash } from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";
import { createId, type PackLanguage, stableHash } from "../../core/src/index.js";

export type VoiceRuntime = "browser" | "server";
export type VoiceProviderId =
  | "stub-asr"
  | "stub-tts"
  | "browser-webspeech"
  | "browser-speechsynthesis"
  | "local-whisper"
  | "local-piper"
  | "openai-compatible-asr"
  | "openai-compatible-tts";

export type VoiceCapability = "asr-file" | "asr-live" | "tts-speak" | "tts-audio" | "tts-stream";
export type VoicePrivacyLabel = "local" | "browser-dependent" | "cloud";

export type VoiceProviderInfo = {
  id: VoiceProviderId;
  label: string;
  runtime: VoiceRuntime;
  capabilities: VoiceCapability[];
  local: boolean;
  requiresNetwork: boolean;
  requiresSecret: boolean;
  privacyLabel: VoicePrivacyLabel;
};

export type AudioInput = {
  bytes: Uint8Array;
  mimeType: string;
  filename?: string;
  sampleRate?: number;
};

export type AsrOptions = {
  providerId?: VoiceProviderId;
  language?: PackLanguage | string;
  prompt?: string;
  translateToEnglish?: boolean;
  timestamps?: "none" | "segment" | "word";
};

export type TranscriptSegment = {
  text: string;
  startMs?: number;
  endMs?: number;
  speaker?: string;
  confidence?: number;
};

export type AsrResult = {
  providerId: VoiceProviderId;
  text: string;
  language?: string;
  durationMs?: number;
  confidence?: number;
  segments: TranscriptSegment[];
  transcriptId: string;
};

export type TtsOptions = {
  providerId?: VoiceProviderId;
  voice?: string;
  language?: PackLanguage | string;
  format?: "mp3" | "wav" | "opus" | "pcm";
  speed?: number;
  instructions?: string;
};

export type TtsAudio = {
  providerId: VoiceProviderId;
  bytes: Uint8Array;
  mimeType: string;
  durationMs?: number;
  sha256: string;
  voiceId: string;
};

export type VoicePreviewManifest = {
  voiceId: string;
  providerId: VoiceProviderId;
  language: string;
  sampleRate: number;
  durationMs: number;
  sha256: string;
  sourcePackId?: string;
};

export interface AsrAdapter {
  info: VoiceProviderInfo;
  transcribe(audio: AudioInput, options?: AsrOptions): Promise<AsrResult>;
}

export interface TtsAdapter {
  info: VoiceProviderInfo;
  synthesize(text: string, options?: TtsOptions): Promise<TtsAudio>;
  listVoices?(): Promise<Array<{ id: string; label: string; language?: string }>>;
}

const decoder = new TextDecoder("utf8", { fatal: false });
const encoder = new TextEncoder();

export const voiceProviders: VoiceProviderInfo[] = [
  { id: "stub-asr", label: "Stub ASR", runtime: "server", capabilities: ["asr-file"], local: true, requiresNetwork: false, requiresSecret: false, privacyLabel: "local" },
  { id: "stub-tts", label: "Stub TTS", runtime: "server", capabilities: ["tts-audio"], local: true, requiresNetwork: false, requiresSecret: false, privacyLabel: "local" },
  { id: "browser-webspeech", label: "Browser WebSpeech", runtime: "browser", capabilities: ["asr-live"], local: false, requiresNetwork: false, requiresSecret: false, privacyLabel: "browser-dependent" },
  { id: "browser-speechsynthesis", label: "Browser SpeechSynthesis", runtime: "browser", capabilities: ["tts-speak"], local: false, requiresNetwork: false, requiresSecret: false, privacyLabel: "browser-dependent" },
  { id: "local-whisper", label: "Local Whisper-compatible ASR", runtime: "server", capabilities: ["asr-file"], local: true, requiresNetwork: false, requiresSecret: false, privacyLabel: "local" },
  { id: "local-piper", label: "Local Piper-compatible TTS", runtime: "server", capabilities: ["tts-audio"], local: true, requiresNetwork: false, requiresSecret: false, privacyLabel: "local" },
  { id: "openai-compatible-asr", label: "OpenAI-compatible ASR", runtime: "server", capabilities: ["asr-file"], local: false, requiresNetwork: true, requiresSecret: true, privacyLabel: "cloud" },
  { id: "openai-compatible-tts", label: "OpenAI-compatible TTS", runtime: "server", capabilities: ["tts-audio"], local: false, requiresNetwork: true, requiresSecret: true, privacyLabel: "cloud" }
];

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function inferLanguage(text: string, fallback = "en"): string {
  if (/[\u4e00-\u9fa5]/.test(text)) return "zh";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[¿¡ñáéíóú]/i.test(text)) return "es";
  return fallback;
}

function parseSidecarJson(raw: string): Partial<AsrResult> | undefined {
  try {
    const parsed = JSON.parse(raw) as {
      text?: string;
      language?: string;
      durationMs?: number;
      confidence?: number;
      segments?: TranscriptSegment[];
    };
    if (typeof parsed.text === "string" || Array.isArray(parsed.segments)) return parsed;
  } catch {
    return undefined;
  }
  return undefined;
}

function vttToSegments(raw: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const blocks = raw.replace(/\r/g, "").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timing = lines.find((line) => line.includes("-->"));
    const text = lines.filter((line) => line !== timing && !/^\d+$/.test(line)).join(" ").trim();
    if (!text) continue;
    segments.push({ text, confidence: 0.84 });
  }
  return segments;
}

function textFromBytes(audio: AudioInput): string {
  const decoded = decoder.decode(audio.bytes).replace(/\0/g, "").trim();
  const sidecar = parseSidecarJson(decoded);
  if (sidecar?.text) return sidecar.text;
  if (decoded.includes("-->")) return vttToSegments(decoded).map((segment) => segment.text).join("\n");
  if (decoded && /[\p{Letter}\p{Number}\u4e00-\u9fa5]/u.test(decoded)) return decoded;
  if (audio.filename?.toLowerCase().includes("zh")) return "我: 这条语音听起来挺轻松\nTA: 周末可能去 你也喜欢这种吗？";
  return "Me: This voice note sounds relaxed\nTA: Maybe this weekend. Do you like this kind of exhibition too?";
}

export async function transcribeAudio(audio: AudioInput, options: AsrOptions = {}): Promise<AsrResult> {
  const providerId = options.providerId ?? "stub-asr";
  const decoded = decoder.decode(audio.bytes).trim();
  const sidecar = parseSidecarJson(decoded);
  const segments = sidecar?.segments ?? (decoded.includes("-->") ? vttToSegments(decoded) : undefined);
  const text = sidecar?.text ?? segments?.map((segment) => segment.text).join("\n") ?? textFromBytes(audio);
  const language = sidecar?.language ?? options.language ?? inferLanguage(text);
  const normalizedSegments = segments?.length
    ? segments
    : text.split(/\n+/).filter(Boolean).map((line, index) => ({
      text: line,
      startMs: index * 2400,
      endMs: index * 2400 + 1800,
      confidence: sidecar?.confidence ?? 0.86
    }));
  return {
    providerId,
    text,
    language,
    durationMs: sidecar?.durationMs ?? Math.max(1200, normalizedSegments.length * 2400),
    confidence: sidecar?.confidence ?? 0.86,
    segments: normalizedSegments,
    transcriptId: createId("transcript", `${providerId}:${sha256(audio.bytes)}:${text.slice(0, 80)}`)
  };
}

function fakeWavBytes(text: string, options: TtsOptions): Uint8Array {
  const voice = options.voice ?? "kskill-default";
  const payload = encoder.encode(`KSKILL_STUB_WAV\nvoice=${voice}\nlanguage=${options.language ?? "auto"}\ntext=${text}\n`);
  return payload;
}

export async function synthesizeSpeech(text: string, options: TtsOptions = {}): Promise<TtsAudio> {
  const providerId = options.providerId ?? "stub-tts";
  const bytes = fakeWavBytes(text, options);
  return {
    providerId,
    bytes,
    mimeType: options.format === "mp3" ? "audio/mpeg" : "audio/wav",
    durationMs: Math.max(900, Math.ceil(text.length / 12) * 1000),
    sha256: sha256(bytes),
    voiceId: options.voice ?? `kskill-${stableHash(`${providerId}:${options.language ?? "auto"}`).slice(0, 8)}`
  };
}

export function voicePreviewManifest(audio: TtsAudio, language: string, sourcePackId?: string): VoicePreviewManifest {
  return {
    voiceId: audio.voiceId,
    providerId: audio.providerId,
    language,
    sampleRate: 24000,
    durationMs: audio.durationMs ?? 0,
    sha256: audio.sha256,
    ...(sourcePackId ? { sourcePackId } : {})
  };
}

