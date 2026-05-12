import {
  createId,
  nowIso,
  stableHash,
  type Evidence,
  type MemoryEpisode,
  type PersonaPack
} from "../../core/src/index.ts";
import type { ParsedSource } from "../../importers/src/index.ts";

const emotionWords = ["想", "记得", "喜欢", "讨厌", "开心", "难过", "紧张", "sorry", "miss", "love", "like", "remember"];
const decisionWords = ["因为", "所以", "应该", "不要", "选择", "判断", "why", "because", "should", "choose"];

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

export function distillPersonaPack(pack: PersonaPack, source: ParsedSource): PersonaPack {
  const evidence = extractEvidence(source);
  const episodes = extractEpisodes(source);
  const speakers = topSpeakers(source);
  const updated = structuredClone(pack) as PersonaPack;

  updated.sources = [...updated.sources, source.source];
  updated.updatedAt = nowIso();
  updated.identity.voice = [
    ...new Set([
      ...updated.identity.voice,
      source.source.language === "zh" ? "保留原始聊天里的节奏和称呼" : "preserve cadence and address patterns from the source",
      source.messages.some((message) => /哈哈|lol|haha/i.test(message.text)) ? (source.source.language === "zh" ? "能轻松接梗" : "lightly playful when evidence supports it") : "measured"
    ])
  ];
  updated.identity.expressionDna = [
    ...new Set([
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
  updated.heuristics = [...new Set([...updated.heuristics, ...extractHeuristics(source)])];
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

  return updated;
}

export function renderDistillationSummary(pack: PersonaPack): string {
  return `# Distillation Summary\n\n- Pack: ${pack.name}\n- Type: ${pack.type}\n- Sources: ${pack.sources.length}\n- Evidence items: ${pack.distillation.evidence.length}\n- Memory episodes: ${pack.memory.episodes.length}\n- Mental models: ${pack.mentalModels.length}\n`;
}
