import {
  createId,
  nowIso,
  stableHash,
  type Evidence,
  type MemoryEpisode,
  type PersonaPack
} from "../../core/src/index.js";
import type { ParsedSource } from "../../importers/src/index.js";
import { z } from "zod";

const emotionWords = ["想", "记得", "喜欢", "讨厌", "开心", "难过", "紧张", "sorry", "miss", "love", "like", "remember"];
const decisionWords = ["因为", "所以", "应该", "不要", "选择", "判断", "why", "because", "should", "choose"];

const DraftEvidenceSchema = z.object({
  id: z.string().optional(),
  sourceId: z.string().optional(),
  quote: z.string().min(1),
  claim: z.string().min(1),
  confidence: z.number().min(0).max(1).default(0.72),
  kind: z.enum(["direct", "inferred", "contradiction", "user_supplied"]).default("inferred")
});

const DraftClaimSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  evidenceIds: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.72)
});

const DraftEpisodeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  participants: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.68),
  createdAt: z.string().optional(),
  disabled: z.boolean().default(false)
});

const DraftMentalModelSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  evidenceIds: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.72)
});

const DraftEvalSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().min(1),
  expected: z.string().min(1),
  dimension: z.enum(["voice", "memory", "boundary", "reasoning", "safety"])
});

const DraftLorebookEntrySchema = z.object({
  keys: z.array(z.string()).default([]),
  content: z.string().min(1),
  priority: z.number().default(50)
});

export const DistillationDraftSchema = z.object({
  evidence: z.array(DraftEvidenceSchema).default([]),
  claims: z.array(DraftClaimSchema).default([]),
  episodes: z.array(DraftEpisodeSchema).default([]),
  voice: z.array(z.string()).default([]),
  expressionDna: z.array(z.string()).default([]),
  heuristics: z.array(z.string()).default([]),
  mentalModels: z.array(DraftMentalModelSchema).default([]),
  profileFacts: z.record(z.string(), z.string()).default({}),
  relationshipFacts: z.record(z.string(), z.string()).default({}),
  preferences: z.array(z.string()).default([]),
  lorebook: z.array(DraftLorebookEntrySchema).default([]),
  contradictions: z.array(z.string()).default([]),
  evals: z.array(DraftEvalSchema).default([])
});

export type DistillationDraft = z.infer<typeof DistillationDraftSchema>;

export type DistillationProviderName = "none" | "openai-compatible" | "openai" | "deepseek" | "anthropic" | "anthropic-compatible" | "ollama";
export type DistillProviderName = DistillationProviderName;

export type DistillationProviderRequest = {
  provider: Exclude<DistillationProviderName, "none">;
  model?: string;
  prompt: string;
  pack: PersonaPack;
  source: ParsedSource;
  attempt: number;
};

export type DistillationCompletion = (request: DistillationProviderRequest) => Promise<unknown>;

export type DistillPersonaPackAsyncOptions = {
  provider?: DistillationProviderName;
  model?: string | undefined;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
  timeoutMs?: number | undefined;
  maxAttempts?: number | undefined;
  maxRetries?: number | undefined;
  requireLlm?: boolean | undefined;
  requireLLM?: boolean | undefined;
  completion?: DistillationCompletion;
  fetch?: typeof fetch;
};

export type DistillPersonaPackAsyncResult = {
  pack: PersonaPack;
  draft?: DistillationDraft;
  usedFallback: boolean;
  warnings: string[];
  attempts: number;
};

function topSpeakers(source: ParsedSource): string[] {
  const counts = new Map<string, number>();
  for (const message of source.messages) {
    counts.set(message.speaker, (counts.get(message.speaker) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([speaker]) => speaker).slice(0, 4);
}

function extractEvidence(source: ParsedSource): Evidence[] {
  const selected = source.messages
    .filter((message) => emotionWords.some((word) => message.text.toLowerCase().includes(word.toLowerCase())) || /[?？!！]/.test(message.text))
    .slice(0, 24);
  const fallback = selected.length > 0 ? selected : source.messages.filter((message) => message.text.length > 8).slice(0, 8);
  return fallback
    .map((message) => ({
      id: createId("ev", `${message.id}:distill`),
      sourceId: source.source.id,
      quote: message.text,
      claim: "This message carries voice, relationship, or emotional signal.",
      confidence: 0.72,
      kind: "direct",
      attachmentIds: message.attachments?.map((attachment) => attachment.assetId) ?? [],
      createdAt: nowIso()
    }));
}

function extractEpisodes(source: ParsedSource): MemoryEpisode[] {
  const speakers = topSpeakers(source);
  const candidates = source.messages
    .filter((message) => emotionWords.some((word) => message.text.toLowerCase().includes(word.toLowerCase())) || message.text.length > 12)
    .slice(0, 12);

  return candidates.map((message, index) => ({
    id: createId("episode", `${source.source.id}:${index}:${message.raw}`),
    title: `${message.speaker}: ${message.text.slice(0, 28)}`,
    summary: message.text,
    participants: speakers,
    sourceIds: [source.source.id],
    attachmentIds: message.attachments?.map((attachment) => attachment.assetId) ?? [],
    confidence: 0.68,
    createdAt: nowIso(),
    disabled: false
  }));
}

function extractHeuristics(source: ParsedSource): string[] {
  const samples = source.messages.filter((message) => decisionWords.some((word) => message.text.toLowerCase().includes(word.toLowerCase()))).slice(0, 6);
  if (samples.length === 0) {
    return [
      "Ask for evidence before making strong claims.",
      "When the conversation is emotionally loaded, keep the response short and concrete.",
      "Prefer repair and clarification over pressure."
    ];
  }
  return samples.map((message) => `When a topic resembles "${message.text.slice(0, 42)}", respond with the same level of specificity and restraint.`);
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function appendDistillationRun(
  pack: PersonaPack,
  run: {
    mode: "heuristic" | "llm";
    provider: string;
    model?: string;
    sourceId?: string;
    evidenceCount: number;
    warnings?: string[];
  }
): void {
  pack.distillation.runs = [
    ...(pack.distillation.runs ?? []),
    {
      id: createId("run", `${run.mode}:${run.provider}:${run.model ?? "none"}:${run.sourceId ?? "none"}:${nowIso()}`),
      mode: run.mode,
      provider: run.provider,
      ...(run.model ? { model: run.model } : {}),
      ...(run.sourceId ? { sourceId: run.sourceId } : {}),
      evidenceCount: run.evidenceCount,
      warnings: run.warnings ?? [],
      createdAt: nowIso()
    }
  ];
}

export function distillPersonaPack(pack: PersonaPack, source: ParsedSource): PersonaPack {
  const evidence = extractEvidence(source);
  const episodes = extractEpisodes(source);
  const speakers = topSpeakers(source);
  const updated = structuredClone(pack) as PersonaPack;

  updated.sources = updated.sources.some((item) => item.id === source.source.id || item.hash === source.source.hash) ? updated.sources : [...updated.sources, source.source];
  updated.updatedAt = nowIso();
  updated.identity.voice = [
    ...uniqueValues([
      ...updated.identity.voice,
      source.source.language === "zh" ? "保留原始聊天里的节奏和称呼" : "preserve cadence and address patterns from the source",
      source.messages.some((message) => /哈哈|lol|haha/i.test(message.text)) ? (source.source.language === "zh" ? "能轻松接梗" : "lightly playful when evidence supports it") : "measured"
    ])
  ];
  updated.identity.expressionDna = [
    ...uniqueValues([
      ...updated.identity.expressionDna,
      `source-hash:${stableHash(source.text)}`,
      `top-speakers:${speakers.join(",") || "unknown"}`
    ])
  ];
  updated.memory.episodes = [...updated.memory.episodes, ...episodes];
  updated.memory.profileFacts = {
    ...updated.memory.profileFacts,
    sourceCount: String(updated.sources.length),
    lastSource: source.source.name
  };
  updated.memory.relationshipFacts = {
    ...updated.memory.relationshipFacts,
    speakers: speakers.join(", ") || "unknown"
  };
  updated.memory.lorebook = [
    ...updated.memory.lorebook,
    ...episodes.slice(0, 6).map((episode) => ({
      keys: episode.title.split(/\s+/).slice(0, 3),
      content: episode.summary,
      priority: 50
    }))
  ];
  updated.distillation.evidence = [...updated.distillation.evidence, ...evidence];
  updated.distillation.claims = [
    ...updated.distillation.claims,
    ...evidence.slice(0, 12).map((item) => ({
      id: createId("claim", item.id),
      text: item.claim,
      evidenceIds: [item.id],
      confidence: item.confidence
    }))
  ];
  updated.heuristics = uniqueValues([...updated.heuristics, ...extractHeuristics(source)]);
  updated.mentalModels = [
    ...updated.mentalModels,
    {
      name: source.source.language === "zh" ? "关系证据优先" : "Relationship evidence first",
      description:
        source.source.language === "zh"
          ? "回复前先检查共同经历、称呼、边界信号，而不是套用通用恋爱话术。"
          : "Check shared memories, address patterns, and boundary signals before using generic relationship advice.",
      evidenceIds: evidence.slice(0, 4).map((item) => item.id),
      confidence: evidence.length > 0 ? 0.76 : 0.52
    }
  ];
  appendDistillationRun(updated, {
    mode: "heuristic",
    provider: "heuristic",
    sourceId: source.source.id,
    evidenceCount: evidence.length
  });

  return updated;
}

function distillationPrompt(pack: PersonaPack, source: ParsedSource): string {
  const messages = source.messages
    .slice(0, 80)
    .map((message) => `${message.speaker}: ${message.text}`)
    .join("\n");
  return [
    "Distill the source into a K.skill DistillationDraft.",
    "Return only JSON. Do not wrap it in markdown.",
    "Required top-level keys: evidence, claims, episodes, voice, expressionDna, heuristics, mentalModels, contradictions, evals.",
    "Evidence items need quote, claim, confidence. Keep every claim grounded in source text.",
    `Pack: ${pack.name} (${pack.type}, ${pack.language})`,
    `Source: ${source.source.name} (${source.source.language})`,
    "Source messages:",
    messages || source.text.slice(0, 6000)
  ].join("\n\n");
}

function extractJsonPayload(raw: unknown): unknown {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return JSON.parse(fenced?.[1] ?? trimmed);
  }

  if (!raw || typeof raw !== "object") return raw;
  const record = raw as Record<string, unknown>;
  const choices = record.choices;
  if (Array.isArray(choices)) {
    const first = choices[0] as Record<string, unknown> | undefined;
    const message = first?.message as Record<string, unknown> | undefined;
    if (typeof message?.content === "string") return extractJsonPayload(message.content);
    if (typeof first?.text === "string") return extractJsonPayload(first.text);
  }

  const content = record.content;
  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (item && typeof item === "object" && "text" in item) return String((item as Record<string, unknown>).text ?? "");
        return "";
      })
      .join("\n")
      .trim();
    if (text) return extractJsonPayload(text);
  }

  return raw;
}

async function callOpenAiCompatible(request: DistillationProviderRequest, options: DistillPersonaPackAsyncOptions): Promise<unknown> {
  const fetchImpl = options.fetch ?? fetch;
  const apiKey =
    options.apiKey ??
    (request.provider === "deepseek" ? process.env.DEEPSEEK_API_KEY : request.provider === "ollama" ? undefined : process.env.OPENAI_API_KEY);
  const defaultBaseUrl =
    request.provider === "deepseek"
      ? "https://api.deepseek.com"
      : request.provider === "ollama"
        ? "http://localhost:11434/v1"
        : process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const baseUrl = (options.baseUrl ?? defaultBaseUrl).replace(/\/+$/, "");
  if (request.provider !== "ollama" && !apiKey) throw new Error(`${request.provider} API key is required when no custom completion adapter is provided`);
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: request.model ?? (request.provider === "ollama" ? "llama3.1" : "gpt-4.1-mini"),
      temperature: 0.2,
      ...(request.provider === "ollama" ? {} : { response_format: { type: "json_object" } }),
      messages: [
        { role: "system", content: "You are a careful persona-pack distiller. Return valid JSON only." },
        { role: "user", content: request.prompt }
      ]
    })
  });
  if (!response.ok) throw new Error(`${request.provider} request failed with HTTP ${response.status}`);
  return response.json();
}

async function callAnthropic(request: DistillationProviderRequest, options: DistillPersonaPackAsyncOptions): Promise<unknown> {
  const fetchImpl = options.fetch ?? fetch;
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  const baseUrl = (options.baseUrl ?? "https://api.anthropic.com/v1").replace(/\/+$/, "");
  if (!apiKey) throw new Error("anthropic API key is required when no custom completion adapter is provided");

  const response = await fetchImpl(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: request.model ?? "claude-3-5-haiku-latest",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are a careful persona-pack distiller. Return valid JSON only.",
      messages: [{ role: "user", content: request.prompt }]
    })
  });
  if (!response.ok) throw new Error(`anthropic request failed with HTTP ${response.status}`);
  return response.json();
}

async function callProvider(request: DistillationProviderRequest, options: DistillPersonaPackAsyncOptions): Promise<unknown> {
  if (options.completion) return options.completion(request);
  if (request.provider === "anthropic" || request.provider === "anthropic-compatible") return callAnthropic(request, options);
  return callOpenAiCompatible(request, options);
}

function mergeDraftIntoPack(pack: PersonaPack, source: ParsedSource, draft: DistillationDraft, provider: string, model: string | undefined, warnings: string[]): PersonaPack {
  const updated = structuredClone(pack) as PersonaPack;
  const timestamp = nowIso();
  const speakers = topSpeakers(source);
  const evidence: Evidence[] = draft.evidence.map((item, index) => ({
    id: item.id ?? createId("ev", `${source.source.id}:llm:${index}:${item.quote}`),
    sourceId: item.sourceId ?? source.source.id,
    quote: item.quote,
    claim: item.claim,
    confidence: item.confidence,
    kind: item.kind,
    attachmentIds: [],
    createdAt: timestamp
  }));
  const evidenceIds = evidence.map((item) => item.id);
  const episodes: MemoryEpisode[] = draft.episodes.map((item, index) => ({
    id: item.id ?? createId("episode", `${source.source.id}:llm:${index}:${item.title}:${item.summary}`),
    title: item.title,
    summary: item.summary,
    participants: item.participants.length > 0 ? item.participants : speakers,
    sourceIds: item.sourceIds.length > 0 ? item.sourceIds : [source.source.id],
    attachmentIds: [],
    confidence: item.confidence,
    createdAt: item.createdAt ?? timestamp,
    disabled: item.disabled
  }));

  updated.sources = updated.sources.some((item) => item.id === source.source.id || item.hash === source.source.hash) ? updated.sources : [...updated.sources, source.source];
  updated.updatedAt = timestamp;
  updated.identity.voice = uniqueValues([...updated.identity.voice, ...draft.voice]);
  updated.identity.expressionDna = uniqueValues([
    ...updated.identity.expressionDna,
    `source-hash:${stableHash(source.text)}`,
    `llm-provider:${provider}`,
    ...draft.expressionDna
  ]);
  updated.memory.profileFacts = { ...updated.memory.profileFacts, ...draft.profileFacts, sourceCount: String(updated.sources.length), lastSource: source.source.name };
  updated.memory.relationshipFacts = { ...updated.memory.relationshipFacts, ...draft.relationshipFacts };
  updated.memory.preferences = uniqueValues([...updated.memory.preferences, ...draft.preferences]);
  updated.memory.episodes = [...updated.memory.episodes, ...episodes];
  updated.memory.lorebook = [
    ...updated.memory.lorebook,
    ...draft.lorebook,
    ...episodes.slice(0, 4).map((episode) => ({
      keys: episode.title.split(/\s+/).slice(0, 3),
      content: episode.summary,
      priority: 55
    }))
  ];
  updated.distillation.evidence = [...updated.distillation.evidence, ...evidence];
  updated.distillation.claims = [
    ...updated.distillation.claims,
    ...draft.claims.map((item, index) => ({
      id: item.id ?? createId("claim", `${source.source.id}:llm:${index}:${item.text}`),
      text: item.text,
      evidenceIds: item.evidenceIds.length > 0 ? item.evidenceIds : evidenceIds.slice(0, 1),
      confidence: item.confidence
    }))
  ];
  updated.distillation.contradictions = uniqueValues([...updated.distillation.contradictions, ...draft.contradictions]);
  updated.heuristics = uniqueValues([...updated.heuristics, ...draft.heuristics]);
  updated.mentalModels = [...updated.mentalModels, ...draft.mentalModels];
  updated.evals = [
    ...updated.evals,
    ...draft.evals.map((item, index) => ({
      id: item.id ?? createId("eval", `${source.source.id}:llm:${index}:${item.prompt}`),
      prompt: item.prompt,
      expected: item.expected,
      dimension: item.dimension
    }))
  ];
  appendDistillationRun(updated, {
    mode: "llm",
    provider,
    ...(model ? { model } : {}),
    sourceId: source.source.id,
    evidenceCount: evidence.length,
    warnings
  });
  return updated;
}

function annotateFallbackRun(pack: PersonaPack, provider: string, model: string | undefined, warnings: string[]): PersonaPack {
  const lastRun = pack.distillation.runs.at(-1);
  if (lastRun?.mode === "heuristic") {
    lastRun.provider = provider;
    if (model) lastRun.model = model;
    lastRun.warnings = warnings;
  }
  return pack;
}

export async function distillPersonaPackAsync(
  pack: PersonaPack,
  source: ParsedSource,
  options: DistillPersonaPackAsyncOptions = {}
): Promise<DistillPersonaPackAsyncResult> {
  const provider = options.provider ?? "none";
  const requireLlm = options.requireLlm ?? options.requireLLM ?? false;
  const warnings: string[] = [];

  if (provider === "none") {
    if (requireLlm) throw new Error("LLM distillation required but provider is none");
    return {
      pack: annotateFallbackRun(distillPersonaPack(pack, source), "none", options.model, ["Provider disabled; used heuristic fallback."]),
      usedFallback: true,
      warnings: ["Provider disabled; used heuristic fallback."],
      attempts: 0
    };
  }

  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? ((options.maxRetries ?? 1) + 1)));
  const prompt = distillationPrompt(pack, source);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const raw = await callProvider({ provider, ...(options.model ? { model: options.model } : {}), prompt, pack, source, attempt }, options);
      const payload = extractJsonPayload(raw);
      const validation = DistillationDraftSchema.safeParse(payload);
      if (validation.success) {
        return {
          pack: mergeDraftIntoPack(pack, source, validation.data, provider, options.model, warnings),
          draft: validation.data,
          usedFallback: false,
          warnings,
          attempts: attempt
        };
      }
      warnings.push(`Attempt ${attempt} schema validation failed: ${validation.error.issues.map((issue) => issue.path.join(".") || "root").join(", ")}`);
    } catch (error) {
      warnings.push(`Attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (requireLlm) {
    throw new Error(`LLM distillation required but ${provider} did not produce a valid draft after ${maxAttempts} attempt(s): ${warnings.join("; ")}`);
  }

  return {
    pack: annotateFallbackRun(distillPersonaPack(pack, source), provider, options.model, warnings),
    usedFallback: true,
    warnings,
    attempts: maxAttempts
  };
}

export function renderDistillationSummary(pack: PersonaPack): string {
  return `# Distillation Summary\n\n- Pack: ${pack.name}\n- Type: ${pack.type}\n- Sources: ${pack.sources.length}\n- Evidence items: ${pack.distillation.evidence.length}\n- Memory episodes: ${pack.memory.episodes.length}\n- Mental models: ${pack.mentalModels.length}\n`;
}
