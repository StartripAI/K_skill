import { z } from "zod";
import { personaTypes, supportedPackLanguages } from "../../core/src/index.js";
import { exportTargets } from "../../exporters/src/index.js";

export const ApiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional()
  })
});

export const CreatePackRequestSchema = z.object({
  name: z.string().min(1),
  type: z.enum(personaTypes).default("pursuit"),
  language: z.enum(supportedPackLanguages).default("zh"),
  description: z.string().optional()
});

export const PasteSourceRequestSchema = z.object({
  name: z.string().default("pasted-chat.txt"),
  text: z.string().min(1),
  consentConfirmed: z.boolean().default(false),
  private: z.boolean().default(true)
});

export const PursuitRequestSchema = z.object({
  me: z.string().default("我"),
  ta: z.string().default("TA"),
  goal: z.enum(["break_ice", "continue_chat", "ask_out", "judge_chance", "recover_cold_chat", "write_reply"]).default("judge_chance"),
  latest: z.string().optional(),
  draft: z.string().optional(),
  maxTurns: z.number().int().positive().max(50).default(10),
  style: z.enum(["natural", "humorous", "sincere", "restrained", "direct", "gentle"]).default("natural"),
  variants: z.array(z.string()).default(["safe", "warm", "invite"])
});

export const ExportRequestSchema = z.object({
  target: z.enum(exportTargets),
  includeAssets: z.enum(["all", "metadata", "none"]).default("all")
});

export const VoiceProviderRequestSchema = z.object({
  providerId: z.string().optional(),
  language: z.string().optional()
});

export const TtsRequestSchema = z.object({
  text: z.string().min(1),
  providerId: z.string().optional(),
  voice: z.string().optional(),
  language: z.string().optional(),
  format: z.enum(["mp3", "wav", "opus", "pcm"]).default("wav"),
  referenceAudioPath: z.string().optional(),
  voiceProfilePath: z.string().optional(),
  timeoutMs: z.number().int().positive().max(600000).optional()
});

export const MemoryPatchRequestSchema = z.object({
  corrections: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  relationshipFacts: z.record(z.string(), z.string()).optional()
});

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = z.infer<typeof ApiErrorSchema>;

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string, details?: unknown): ApiFailure {
  return { ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } };
}
