import { createId, nowIso, stableHash, type Evidence, type PackLanguage } from "../../core/src/index.js";
import type { ChatMessage } from "../../importers/src/index.js";

export type PursuitGoal =
  | "break_ice"
  | "continue_chat"
  | "ask_out"
  | "judge_chance"
  | "recover_cold_chat"
  | "write_reply";

export type PursuitStage = "stranger" | "early" | "warm" | "ambiguous" | "cold" | "stable" | "risk" | "boundary";

export type RelationshipStage = {
  id: "first_contact" | "rapport_building" | "date_window" | "cooling" | "respect_boundary" | "unclear";
  label: string;
  rationale: string;
  confidence: number;
};

export type PursuitTrend = {
  direction: "rising" | "steady" | "falling" | "volatile";
  score: number;
  summary: string;
  evidence: Evidence[];
};

export type DateReadiness = {
  verdict: "ready" | "soft_invite_ok" | "wait" | "not_ready" | "blocked";
  score: number;
  reasons: string[];
  blockers: string[];
  suggestedAsk: string;
};

export type ColdRecovery = {
  needed: boolean;
  level: "none" | "light" | "moderate" | "hard";
  summary: string;
  steps: string[];
  checkInAfter: string;
  avoid: string[];
};

export type SendDecision = {
  kind: "send" | "revise" | "wait" | "refuse";
  allowSend: boolean;
  reason: string;
  risks: string[];
  suggestedDraft: string;
  suggestedRewrite: string;
};

export type StyleMatch = {
  targetAverageLength: number;
  userAverageLength: number;
  sentenceLengthDelta: number;
  sentenceLengthMatch: "matched" | "user_shorter" | "user_longer";
  questionRate: number;
  userQuestionRate: number;
  pacing: "balanced" | "user_overinitiates" | "target_overinitiates";
  advice: string[];
};

export type BoundaryAssessment = {
  detected: boolean;
  severity: "none" | "soft" | "concern" | "hard_stop";
  terms: string[];
  lastBoundaryText: string;
  allowEscalation: boolean;
  requiredAction: "none" | "slow_down" | "apologize" | "close";
  reason: string;
};

export type SafetyGate = {
  status: "clear" | "caution" | "blocked";
  allowEscalation: boolean;
  reason: string;
  blockedBy: string[];
};

export type PursuitSafety = {
  boundaryDetected: boolean;
  allowEscalation: boolean;
  gate: SafetyGate;
  nonManipulation: string[];
};

export type PursuitReport = {
  id: string;
  language: PackLanguage;
  stage: PursuitStage;
  goal: PursuitGoal;
  confidence: number;
  communicationStyle: {
    sentenceLength: "short" | "mixed" | "long";
    initiative: "low" | "medium" | "high";
    tone: string[];
    replyRhythm: string;
  };
  interestMap: {
    strong: string[];
    possible: string[];
    avoid: string[];
  };
  warmthSignals: Evidence[];
  riskSignals: Evidence[];
  strategy: {
    action: "continue_lightly" | "soft_invite" | "pause" | "change_topic" | "apologize" | "close" | "respect_boundary";
    summary: string;
    nextMove: string;
  };
  evidence: Evidence[];
  latestTurns: ChatMessage[];
  relationshipStage: RelationshipStage;
  trend: PursuitTrend;
  dateReadiness: DateReadiness;
  coldRecovery: ColdRecovery;
  sendDecision: SendDecision;
  styleMatch: StyleMatch;
  boundary: BoundaryAssessment;
  safety: PursuitSafety;
};

export type ReplyStyle = "natural" | "humorous" | "sincere" | "restrained" | "direct" | "gentle";

export type ReplySuggestion = {
  label: string;
  text: string;
  why: string;
  expectedEffect: string;
  risk: string;
  boundarySafe: boolean;
};

export type ReplyLabIntent = "continue" | "warmth" | "ask" | "repair" | "close" | "apology";

export type ReplyLabVariant = ReplySuggestion & {
  intent: ReplyLabIntent;
  style: ReplyStyle;
};

export type ReplyLab = {
  allowEscalation: boolean;
  safetyGate: SafetyGate;
  variants: ReplyLabVariant[];
};

export type TopicPlan = {
  lowRiskTopics: string[];
  interestBasedTopics: string[];
  inviteTopics: string[];
  avoidTopics: string[];
  boundaries: string[];
  markdown: string;
};

export type PursuitOptions = {
  userName: string;
  targetName: string;
  goal: PursuitGoal;
  language?: PackLanguage | undefined;
  latestMessage?: string | undefined;
  draftMessage?: string | undefined;
  maxTurns?: number | undefined;
};

const zhRejection = ["别再", "不要再", "不想聊", "别问", "算了", "没兴趣", "别联系", "请尊重", "不舒服", "拒绝"];
const enRejection = ["stop asking", "not interested", "don't want", "do not want", "please respect", "uncomfortable", "leave me alone", "no thanks"];
const zhCold = ["哦", "嗯", "随便", "再说", "不知道", "忙", "呵呵"];
const enCold = ["ok", "k", "busy", "maybe", "idk", "not sure"];
const zhWarm = ["哈哈", "！", "?", "？", "你呢", "你也", "下次", "周末", "可以", "有意思", "喜欢"];
const enWarm = ["haha", "lol", "you?", "what about you", "weekend", "maybe we", "sounds fun", "interesting"];
const zhSoftBoundary = ["最近忙", "有点忙", "下次吧", "改天", "先这样", "不太方便", "有压力"];
const enSoftBoundary = ["busy lately", "another time", "not a good time", "too much", "pressure", "need space"];
const zhEscalation = ["约", "见面", "吃饭", "看电影", "试试", "机会", "喜欢你", "追你", "再给我"];
const enEscalation = ["date", "dinner", "meet", "try", "chance", "one drink", "go out", "like you", "give me"];
const zhRespectfulClose = ["抱歉", "尊重", "不再", "空间", "分寸", "打扰"];
const enRespectfulClose = ["sorry", "respect", "space", "stop asking", "leave it here", "boundary", "understood"];

const interestKeywords = [
  "咖啡",
  "看书",
  "书店",
  "展",
  "摄影",
  "做饭",
  "电影",
  "音乐",
  "旅行",
  "运动",
  "游戏",
  "小店",
  "猫",
  "狗",
  "coffee",
  "book",
  "art",
  "exhibition",
  "photography",
  "cooking",
  "movie",
  "music",
  "travel",
  "game"
];

function inferLanguage(messages: ChatMessage[]): PackLanguage {
  const text = messages.map((message) => message.text).join("\n");
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u4e00-\u9fa5]/.test(text)) return "zh";
  if (/[¿¡ñáéíóú]/i.test(text)) return "es";
  return "en";
}

function evidenceFromMessage(sourceId: string, message: ChatMessage, claim: string, confidence: number): Evidence {
  return {
    id: createId("ev", `${message.id}:${claim}`),
    sourceId,
    quote: message.text,
    claim,
    confidence,
    kind: "direct",
    attachmentIds: message.attachments?.map((attachment) => attachment.assetId) ?? [],
    createdAt: nowIso()
  };
}

function containsAny(text: string, needles: string[]): boolean {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

function matchingTerms(text: string, needles: string[]): string[] {
  const lower = text.toLowerCase();
  return needles.filter((needle) => lower.includes(needle.toLowerCase()));
}

function targetMessages(messages: ChatMessage[], targetName: string): ChatMessage[] {
  return messages.filter((message) => message.speaker === targetName);
}

function speakerMessages(messages: ChatMessage[], userName: string): ChatMessage[] {
  return messages.filter((message) => message.speaker === userName);
}

function extractInterests(messages: ChatMessage[]): string[] {
  const text = messages.map((message) => message.text).join(" ").toLowerCase();
  return [...new Set(interestKeywords.filter((keyword) => text.includes(keyword.toLowerCase())))].slice(0, 12);
}

function averageLength(messages: ChatMessage[]): number {
  if (messages.length === 0) return 0;
  return messages.reduce((sum, message) => sum + message.text.length, 0) / messages.length;
}

function questionRate(messages: ChatMessage[]): number {
  if (messages.length === 0) return 0;
  return messages.filter((message) => /[?？]/.test(message.text)).length / messages.length;
}

function latestTurns(messages: ChatMessage[], maxTurns = 8): ChatMessage[] {
  const safeMax = Math.max(1, Math.min(40, Math.floor(maxTurns)));
  return messages.slice(Math.max(0, messages.length - safeMax));
}

function scoreTargetMessage(message: ChatMessage, warmTerms: string[], coldTerms: string[], rejectionTerms: string[]): number {
  let score = 0;
  if (containsAny(message.text, warmTerms)) score += 2;
  if (/[?？]/.test(message.text)) score += 2;
  if (message.text.length > 12) score += 1;
  if (containsAny(message.text, coldTerms)) score -= 2;
  if (containsAny(message.text, rejectionTerms)) score -= 5;
  return score;
}

function averageScore(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildTrend(
  sourceId: string,
  target: ChatMessage[],
  language: PackLanguage,
  warmTerms: string[],
  coldTerms: string[],
  rejectionTerms: string[]
): PursuitTrend {
  if (target.length === 0) {
    return {
      direction: "steady",
      score: 0,
      summary: language === "zh" ? "TA 消息不足，暂不判断趋势。" : "Not enough target messages to judge the trend.",
      evidence: []
    };
  }

  const scored = target.map((message) => ({ message, score: scoreTargetMessage(message, warmTerms, coldTerms, rejectionTerms) }));
  const split = Math.max(1, Math.floor(scored.length / 2));
  const early = averageScore(scored.slice(0, split).map((item) => item.score));
  const recent = averageScore(scored.slice(split).map((item) => item.score));
  const delta = recent - early;
  const hasHardBoundary = scored.some((item) => containsAny(item.message.text, rejectionTerms));
  const direction: PursuitTrend["direction"] = hasHardBoundary ? "falling" : delta > 0.3 ? "rising" : delta < -0.3 ? "falling" : "steady";
  const strongest = [...scored].sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 2);
  return {
    direction,
    score: Math.max(-1, Math.min(1, delta / 5)),
    summary: language === "zh"
      ? direction === "rising" ? "最近 TA 的展开度和接话意愿在上升。" : direction === "falling" ? "最近 TA 的接话或边界信号转弱。" : "最近互动趋势基本稳定。"
      : direction === "rising" ? "Recent target replies are becoming more open and responsive." : direction === "falling" ? "Recent replies or boundary signals are weakening the thread." : "Recent interaction trend is mostly steady.",
    evidence: strongest.map((item) =>
      evidenceFromMessage(sourceId, item.message, language === "zh" ? "用于判断近期趋势" : "Used to judge recent trend", Math.min(0.9, 0.55 + Math.abs(item.score) * 0.08))
    )
  };
}

function buildBoundaryAssessment(
  target: ChatMessage[],
  language: PackLanguage,
  rejectionTerms: string[],
  coldTerms: string[]
): BoundaryAssessment {
  const softTerms = language === "zh" ? zhSoftBoundary : enSoftBoundary;
  const hardMatches = target.flatMap((message) => matchingTerms(message.text, rejectionTerms));
  const softMatches = target.flatMap((message) => matchingTerms(message.text, softTerms));
  const coldMatches = target.flatMap((message) => matchingTerms(message.text, coldTerms));
  const boundaryMessage = [...target].reverse().find((message) => containsAny(message.text, rejectionTerms) || containsAny(message.text, softTerms) || containsAny(message.text, coldTerms));

  if (hardMatches.length > 0) {
    return {
      detected: true,
      severity: "hard_stop",
      terms: [...new Set(hardMatches)],
      lastBoundaryText: boundaryMessage?.text ?? "",
      allowEscalation: false,
      requiredAction: "close",
      reason: language === "zh" ? "TA 已明确拒绝或要求停止，必须停止推进。" : "The target explicitly refused or asked you to stop, so escalation is blocked."
    };
  }

  if (softMatches.length > 0) {
    return {
      detected: true,
      severity: "concern",
      terms: [...new Set(softMatches)],
      lastBoundaryText: boundaryMessage?.text ?? "",
      allowEscalation: false,
      requiredAction: "slow_down",
      reason: language === "zh" ? "TA 表达压力或不方便，先降速。" : "The target signaled pressure or low availability; slow down first."
    };
  }

  if (coldMatches.length >= Math.max(2, Math.ceil(target.length / 2))) {
    return {
      detected: true,
      severity: "soft",
      terms: [...new Set(coldMatches)],
      lastBoundaryText: boundaryMessage?.text ?? "",
      allowEscalation: false,
      requiredAction: "slow_down",
      reason: language === "zh" ? "冷淡回复比例偏高，不适合推进。" : "Cold replies are frequent enough that escalation is not appropriate."
    };
  }

  return {
    detected: false,
    severity: "none",
    terms: [],
    lastBoundaryText: "",
    allowEscalation: true,
    requiredAction: "none",
    reason: language === "zh" ? "未检测到明确边界。" : "No explicit boundary detected."
  };
}

function buildRelationshipStage(
  stage: PursuitStage,
  goal: PursuitGoal,
  trend: PursuitTrend,
  boundary: BoundaryAssessment,
  language: PackLanguage
): RelationshipStage {
  if (boundary.severity === "hard_stop") {
    return {
      id: "respect_boundary",
      label: language === "zh" ? "尊重边界" : "Respect boundary",
      rationale: boundary.reason,
      confidence: 0.94
    };
  }
  if (stage === "cold" || stage === "risk") {
    return {
      id: "cooling",
      label: language === "zh" ? "降温修复" : "Cooling / repair",
      rationale: language === "zh" ? "先降低压力，再观察对方是否愿意恢复互动。" : "Reduce pressure first, then observe whether they re-engage.",
      confidence: 0.76
    };
  }
  if ((stage === "warm" || stage === "stable") && goal === "ask_out" && boundary.allowEscalation) {
    return {
      id: "date_window",
      label: language === "zh" ? "低压力邀约窗口" : "Low-pressure invite window",
      rationale: trend.direction === "rising"
        ? language === "zh" ? "近期回应升温，可以尝试轻量邀约。" : "Recent replies are warming up, so a low-pressure invite is reasonable."
        : language === "zh" ? "已有足够暖信号，但仍要给对方轻松拒绝空间。" : "There are enough warm signals, but the invite still needs an easy out.",
      confidence: 0.82
    };
  }
  if (stage === "stranger") {
    return {
      id: "first_contact",
      label: language === "zh" ? "初识" : "First contact",
      rationale: language === "zh" ? "消息量少，先建立基本熟悉感。" : "There are too few messages; build familiarity first.",
      confidence: 0.66
    };
  }
  if (stage === "warm" || stage === "stable" || stage === "early") {
    return {
      id: "rapport_building",
      label: language === "zh" ? "建立默契" : "Rapport building",
      rationale: language === "zh" ? "继续围绕对方已展开的话题互动。" : "Keep building around topics they already opened.",
      confidence: 0.72
    };
  }
  return {
    id: "unclear",
    label: language === "zh" ? "信号不明" : "Unclear",
    rationale: language === "zh" ? "信息不足或信号混合，先低风险互动。" : "Signals are mixed or limited; keep it low risk.",
    confidence: 0.58
  };
}

function buildDateReadiness(
  stage: PursuitStage,
  goal: PursuitGoal,
  warmthCount: number,
  initiativeRatio: number,
  trend: PursuitTrend,
  boundary: BoundaryAssessment,
  interests: string[],
  language: PackLanguage
): DateReadiness {
  if (!boundary.allowEscalation) {
    return {
      verdict: boundary.severity === "hard_stop" ? "blocked" : "wait",
      score: 0,
      reasons: [],
      blockers: [boundary.reason],
      suggestedAsk: language === "zh" ? "现在不要邀约。" : "Do not invite right now."
    };
  }

  const score = Math.min(100, Math.round(warmthCount * 18 + initiativeRatio * 40 + (trend.direction === "rising" ? 20 : 0) + (interests.length > 0 ? 10 : 0)));
  const ready = score >= 78 && (stage === "warm" || stage === "stable");
  const softOk = score >= 55 && goal === "ask_out" && (stage === "warm" || stage === "stable");
  const interest = interests[0] ?? (language === "zh" ? "你感兴趣的那个地方" : "something you mentioned");
  return {
    verdict: ready ? "ready" : softOk ? "soft_invite_ok" : score >= 40 ? "wait" : "not_ready",
    score,
    reasons: [
      language === "zh" ? `暖信号数量：${warmthCount}` : `Warm signal count: ${warmthCount}`,
      language === "zh" ? `主动提问比例：${Math.round(initiativeRatio * 100)}%` : `Target question ratio vs user messages: ${Math.round(initiativeRatio * 100)}%`,
      trend.summary
    ],
    blockers: ready || softOk ? [] : [language === "zh" ? "邀约前还需要更多自然展开。" : "More natural back-and-forth is needed before inviting."],
    suggestedAsk: language === "zh"
      ? `如果你哪天刚好想去看${interest}，可以叫我，我也想听你推荐。`
      : `If you ever feel like checking out ${interest}, I would be happy to join and keep it low pressure.`
  };
}

function buildColdRecovery(stage: PursuitStage, boundary: BoundaryAssessment, language: PackLanguage): ColdRecovery {
  if (boundary.severity === "hard_stop") {
    return {
      needed: true,
      level: "hard",
      summary: language === "zh" ? "不做冷场修复，改为尊重边界并收尾。" : "Do not attempt cold recovery; respect the boundary and close.",
      steps: language === "zh" ? ["只发送一次简短道歉或收尾。", "停止追问和邀约。"] : ["Send one brief apology or close.", "Stop asking and do not invite again."],
      checkInAfter: language === "zh" ? "不主动再次开启。" : "Do not re-open proactively.",
      avoid: language === "zh" ? ["解释自己", "追问原因", "继续邀约"] : ["explaining yourself", "asking why", "more invites"]
    };
  }
  if (stage === "cold" || stage === "risk" || boundary.severity !== "none") {
    return {
      needed: true,
      level: boundary.severity === "concern" ? "moderate" : "light",
      summary: language === "zh" ? "先降压，再用低负担近况恢复。" : "Lower pressure first, then recover with a low-burden update.",
      steps: language === "zh" ? ["暂停连续追问。", "下一次只发一个轻量近况或共同兴趣。", "对方不接就停止。"] : ["Pause repeated follow-ups.", "Next time, send one light update or shared interest.", "Stop if they do not engage."],
      checkInAfter: language === "zh" ? "至少隔一段自然间隔。" : "Wait for a natural interval.",
      avoid: language === "zh" ? ["查户口式提问", "情绪施压", "连续补充消息"] : ["interrogation-style questions", "emotional pressure", "stacked follow-ups"]
    };
  }
  return {
    needed: false,
    level: "none",
    summary: language === "zh" ? "暂不需要冷场修复。" : "Cold recovery is not needed right now.",
    steps: [],
    checkInAfter: language === "zh" ? "按当前节奏继续。" : "Continue at the current pace.",
    avoid: language === "zh" ? ["突然强推进"] : ["sudden hard escalation"]
  };
}

function buildStyleMatch(target: ChatMessage[], user: ChatMessage[], language: PackLanguage): StyleMatch {
  const targetAverageLength = averageLength(target);
  const userAverageLength = averageLength(user);
  const sentenceLengthDelta = userAverageLength - targetAverageLength;
  const sentenceLengthMatch: StyleMatch["sentenceLengthMatch"] = Math.abs(sentenceLengthDelta) <= 12 ? "matched" : sentenceLengthDelta > 0 ? "user_longer" : "user_shorter";
  const targetQuestionRate = questionRate(target);
  const userQuestionRate = questionRate(user);
  const pacing: StyleMatch["pacing"] = user.length > target.length + 1 ? "user_overinitiates" : target.length > user.length + 1 ? "target_overinitiates" : "balanced";
  const advice: string[] = [];
  if (sentenceLengthMatch === "user_longer") advice.push(language === "zh" ? "回复比 TA 短一点，减少压迫感。" : "Write a little shorter than your current replies.");
  if (userQuestionRate > targetQuestionRate + 0.25) advice.push(language === "zh" ? "减少连续提问，多接住对方内容。" : "Ask fewer stacked questions and reflect more of their content.");
  if (pacing === "user_overinitiates") advice.push(language === "zh" ? "让对方也有开启话题的空间。" : "Leave room for them to initiate too.");
  return {
    targetAverageLength,
    userAverageLength,
    sentenceLengthDelta,
    sentenceLengthMatch,
    questionRate: targetQuestionRate,
    userQuestionRate,
    pacing,
    advice
  };
}

function buildSafety(boundary: BoundaryAssessment, language: PackLanguage): PursuitSafety {
  const blocked = boundary.severity === "hard_stop";
  const caution = !blocked && !boundary.allowEscalation;
  const gate: SafetyGate = {
    status: blocked ? "blocked" : caution ? "caution" : "clear",
    allowEscalation: boundary.allowEscalation,
    reason: blocked
      ? (language === "zh" ? "硬边界已触发，禁止升级。" : "A hard boundary is present; escalation is blocked.")
      : caution
        ? (language === "zh" ? "存在压力或冷淡信号，暂缓升级。" : "Pressure or cold signals are present; pause escalation.")
        : (language === "zh" ? "未触发升级安全阻断。" : "No safety block against escalation is active."),
    blockedBy: boundary.severity === "none" ? [] : [boundary.reason]
  };
  return {
    boundaryDetected: boundary.detected,
    allowEscalation: boundary.allowEscalation,
    gate,
    nonManipulation: language === "zh"
      ? ["不制造焦虑", "不绕过拒绝", "不冒充他人", "不诱导隐私"]
      : ["no anxiety games", "no bypassing refusal", "no impersonation", "no privacy extraction"]
  };
}

function respectfulCloseDraft(language: PackLanguage): string {
  return language === "zh"
    ? "抱歉刚才让你有压力了。我会尊重你的边界，不再继续追问。"
    : "I understand. I am sorry for adding pressure. I will respect your boundary and stop asking.";
}

function hasEscalationText(text: string, language: PackLanguage): boolean {
  return containsAny(text, language === "zh" ? zhEscalation : enEscalation);
}

function hasRespectfulCloseText(text: string, language: PackLanguage): boolean {
  return containsAny(text, language === "zh" ? zhRespectfulClose : enRespectfulClose);
}

function decideSend(
  context: {
    language: PackLanguage;
    boundary: BoundaryAssessment;
    stage: PursuitStage;
    action: PursuitReport["strategy"]["action"];
    dateReadiness: DateReadiness;
    safety: PursuitSafety;
  },
  draft = ""
): SendDecision {
  const zh = context.language === "zh";
  const trimmed = draft.trim();

  if (context.boundary.severity === "hard_stop") {
    if (trimmed && hasRespectfulCloseText(trimmed, context.language) && !hasEscalationText(trimmed, context.language)) {
      return {
        kind: "send",
        allowSend: true,
        reason: zh ? "只发送尊重边界的收尾消息。" : "Only a respectful boundary-close message is sendable.",
        risks: [],
        suggestedDraft: trimmed,
        suggestedRewrite: trimmed
      };
    }
    const rewrite = respectfulCloseDraft(context.language);
    return {
      kind: "refuse",
      allowSend: false,
      reason: zh ? "硬边界已触发，不能再推进或争取。" : "A hard boundary is active; do not escalate, argue, or ask again.",
      risks: [zh ? "继续发送会越界。" : "Continuing would violate the boundary."],
      suggestedDraft: rewrite,
      suggestedRewrite: rewrite
    };
  }

  if (!context.safety.allowEscalation && trimmed && hasEscalationText(trimmed, context.language)) {
    const rewrite = zh ? "先不推进邀约，换一个轻量近况或直接暂停。" : "Skip the invite for now; send a light update or pause.";
    return {
      kind: "revise",
      allowSend: false,
      reason: zh ? "当前存在压力或冷淡信号，草稿推进过快。" : "Pressure or cold signals are present, and the draft escalates too quickly.",
      risks: [zh ? "可能增加对方压力。" : "It may increase pressure."],
      suggestedDraft: rewrite,
      suggestedRewrite: rewrite
    };
  }

  if (!trimmed) {
    const rewrite = context.dateReadiness.verdict === "ready" || context.dateReadiness.verdict === "soft_invite_ok"
      ? context.dateReadiness.suggestedAsk
      : (zh ? "接住 TA 刚才的话题，问一个容易回答的小问题。" : "Pick up their last topic with one easy question.");
    return {
      kind: context.action === "pause" ? "wait" : "send",
      allowSend: context.action !== "pause",
      reason: context.action === "pause"
        ? (zh ? "当前更适合暂停，而不是马上发消息。" : "Pausing is better than sending immediately.")
        : (zh ? "可以发送低压力回复。" : "A low-pressure reply is acceptable."),
      risks: [],
      suggestedDraft: rewrite,
      suggestedRewrite: rewrite
    };
  }

  if (hasEscalationText(trimmed, context.language) && context.dateReadiness.verdict !== "ready" && context.dateReadiness.verdict !== "soft_invite_ok") {
    const rewrite = zh ? "先围绕 TA 的兴趣自然延续一句。" : "Continue naturally around their interest first.";
    return {
      kind: "revise",
      allowSend: false,
      reason: zh ? "邀约条件还不充分，草稿需要降压。" : "The invite window is not strong enough; lower the pressure.",
      risks: [zh ? "过早推进可能导致冷场。" : "Escalating too early may cool the thread."],
      suggestedDraft: rewrite,
      suggestedRewrite: rewrite
    };
  }

  return {
    kind: "send",
    allowSend: true,
    reason: zh ? "草稿没有触发边界或明显施压。" : "The draft does not trigger a boundary or obvious pressure.",
    risks: hasEscalationText(trimmed, context.language) ? [zh ? "发送后要接受对方轻松拒绝。" : "Accept an easy no after sending."] : [],
    suggestedDraft: trimmed,
    suggestedRewrite: trimmed
  };
}

function actionSummary(language: PackLanguage, action: PursuitReport["strategy"]["action"]): { summary: string; nextMove: string } {
  const zh: Record<PursuitReport["strategy"]["action"], { summary: string; nextMove: string }> = {
    continue_lightly: { summary: "继续轻松互动，不急着推进关系。", nextMove: "围绕 TA 已经展开的话题，给一个轻问题或具体反馈。" },
    soft_invite: { summary: "TA 有主动展开和接话信号，可以尝试低压力邀约。", nextMove: "把邀约绑定到 TA 已经感兴趣的场景，并给对方轻松拒绝空间。" },
    pause: { summary: "当前热度低，继续追问会增加压力。", nextMove: "暂停一段时间，下一次用低负担近况开启。" },
    change_topic: { summary: "当前话题没有延展，换到 TA 有兴趣的内容。", nextMove: "从兴趣地图里选一个低风险话题。" },
    apologize: { summary: "对方可能感到压力，先修复边界。", nextMove: "简短道歉，不解释过多，不要求对方立刻回应。" },
    close: { summary: "关系进入收尾或风险状态。", nextMove: "礼貌结束，不继续推进。" },
    respect_boundary: { summary: "TA 已经表达拒绝或不舒服，必须尊重边界。", nextMove: "只发送一次简短尊重边界的回复，然后停止推进。" }
  };
  const en: Record<PursuitReport["strategy"]["action"], { summary: string; nextMove: string }> = {
    continue_lightly: { summary: "Keep the conversation light and do not force escalation.", nextMove: "Use a low-pressure question tied to a topic they already opened." },
    soft_invite: { summary: "There are enough warm signals for a low-pressure invite.", nextMove: "Anchor the invite in their interest and leave an easy out." },
    pause: { summary: "The current temperature is low; more pressure is likely harmful.", nextMove: "Pause, then restart later with a low-burden update." },
    change_topic: { summary: "The current topic is not expanding.", nextMove: "Switch to a known interest with a concrete observation." },
    apologize: { summary: "They may feel pressure; repair before continuing.", nextMove: "Offer a short apology without demanding a reply." },
    close: { summary: "The interaction should be closed respectfully.", nextMove: "End the thread and do not keep pushing." },
    respect_boundary: { summary: "They expressed refusal or discomfort; respect the boundary.", nextMove: "Send one brief respectful message, then stop pursuing." }
  };
  return language === "zh" ? zh[action] : en[action];
}

export function analyzePursuit(messages: ChatMessage[], options: PursuitOptions): PursuitReport {
  const language = options.language ?? inferLanguage(messages);
  const target = targetMessages(messages, options.targetName);
  const user = speakerMessages(messages, options.userName);
  const sourceId = createId("pursuit", messages.map((message) => message.raw).join("|"));
  const rejectionTerms = language === "zh" ? zhRejection : enRejection;
  const coldTerms = language === "zh" ? zhCold : enCold;
  const warmTerms = language === "zh" ? zhWarm : enWarm;
  const recentTurns = latestTurns(messages, options.maxTurns ?? 8);

  const warmthSignals = target
    .filter((message) => containsAny(message.text, warmTerms) || /[?？]/.test(message.text))
    .map((message) => evidenceFromMessage(sourceId, message, language === "zh" ? "TA 主动展开或接话" : "Target opens or extends the conversation", 0.78));
  const riskSignals = target
    .filter((message) => containsAny(message.text, rejectionTerms) || containsAny(message.text, coldTerms))
    .map((message) => evidenceFromMessage(sourceId, message, language === "zh" ? "TA 表达拒绝、冷淡或压力" : "Target signals refusal, coldness, or pressure", 0.86));
  const boundary = buildBoundaryAssessment(target, language, rejectionTerms, coldTerms);
  const trend = buildTrend(sourceId, target, language, warmTerms, coldTerms, rejectionTerms);
  const coldCount = target.filter((message) => containsAny(message.text, coldTerms)).length;
  const initiativeRatio = messages.length > 0 ? target.filter((message) => /[?？]/.test(message.text)).length / Math.max(1, user.length) : 0;
  const targetAverage = averageLength(target);
  const interests = extractInterests(messages);

  let stage: PursuitStage = "early";
  if (boundary.severity === "hard_stop") stage = "boundary";
  else if (boundary.detected) stage = "risk";
  else if (warmthSignals.length >= 1 && initiativeRatio > 0 && options.goal === "ask_out") stage = "warm";
  else if (target.length <= 1) stage = "stranger";
  else if (coldCount >= Math.max(2, target.length / 2)) stage = "cold";
  else if (warmthSignals.length >= 2 && initiativeRatio > 0.2) stage = "warm";
  else if (warmthSignals.length >= 3) stage = "stable";
  else if (riskSignals.length > 0) stage = "risk";
  else stage = "ambiguous";

  let action: PursuitReport["strategy"]["action"] = "continue_lightly";
  if (stage === "boundary") action = "respect_boundary";
  else if (!boundary.allowEscalation) action = "pause";
  else if (stage === "cold") action = options.goal === "recover_cold_chat" ? "pause" : "change_topic";
  else if (stage === "risk") action = "pause";
  else if (stage === "warm" && options.goal === "ask_out") action = "soft_invite";
  else if (stage === "warm" || stage === "stable") action = "continue_lightly";

  const strategy = actionSummary(language, action);
  const allEvidence = [...warmthSignals, ...riskSignals];
  const relationshipStage = buildRelationshipStage(stage, options.goal, trend, boundary, language);
  const dateReadiness = buildDateReadiness(stage, options.goal, warmthSignals.length, initiativeRatio, trend, boundary, interests, language);
  const coldRecovery = buildColdRecovery(stage, boundary, language);
  const styleMatch = buildStyleMatch(target, user, language);
  const safety = buildSafety(boundary, language);
  const sendDecision = decideSend(
    { language, boundary, stage, action, dateReadiness, safety },
    options.draftMessage ?? options.latestMessage ?? ""
  );

  return {
    id: createId("pursuit_report", `${sourceId}:${options.goal}`),
    language,
    stage,
    goal: options.goal,
    confidence: Math.min(0.92, 0.42 + target.length * 0.04 + allEvidence.length * 0.07),
    communicationStyle: {
      sentenceLength: targetAverage > 48 ? "long" : targetAverage > 16 ? "mixed" : "short",
      initiative: initiativeRatio > 0.45 ? "high" : initiativeRatio > 0.15 ? "medium" : "low",
      tone: [
        warmthSignals.length > 0 ? (language === "zh" ? "愿意接话" : "responsive") : (language === "zh" ? "信息不足" : "limited evidence"),
        coldCount > 0 ? (language === "zh" ? "有冷淡片段" : "some cold fragments") : (language === "zh" ? "无明显冷淡" : "no strong cold signal")
      ],
      replyRhythm: target.length >= user.length ? (language === "zh" ? "互动均衡或 TA 偏主动" : "balanced or target-initiated") : (language === "zh" ? "用户更主动" : "user initiates more")
    },
    interestMap: {
      strong: interests.slice(0, 5),
      possible: interests.slice(5, 10),
      avoid: boundary.detected ? (language === "zh" ? ["继续邀约", "追问拒绝原因", "情绪施压"] : ["more invites", "asking why they refused", "emotional pressure"]) : []
    },
    warmthSignals,
    riskSignals,
    strategy: {
      action,
      ...strategy
    },
    evidence: allEvidence,
    latestTurns: recentTurns,
    relationshipStage,
    trend,
    dateReadiness,
    coldRecovery,
    sendDecision,
    styleMatch,
    boundary,
    safety
  };
}

export function generateReplySuggestions(report: PursuitReport, latest: string, style: ReplyStyle = "natural"): ReplySuggestion[] {
  const zh = report.language === "zh";
  if (report.safety.boundaryDetected || report.strategy.action === "respect_boundary") {
    return [
      {
        label: zh ? "尊重边界版" : "Respect boundary",
        text: zh ? "明白了，刚才让你有压力的话我很抱歉。我会尊重你的边界，不再继续追问。" : "I understand. I am sorry for adding pressure. I will respect your boundary and stop asking.",
        why: zh ? "承认边界，不继续争辩。" : "It acknowledges the boundary without arguing.",
        expectedEffect: zh ? "降低压力，保留体面收尾。" : "Reduces pressure and closes respectfully.",
        risk: zh ? "不要再追加解释或求回应。" : "Do not add explanations or ask for a response.",
        boundarySafe: true
      },
      {
        label: zh ? "简短收尾版" : "Short close",
        text: zh ? "收到，谢谢你直接告诉我。我会注意分寸。" : "Got it. Thank you for being direct. I will give you space.",
        why: zh ? "短句，不把情绪负担丢给 TA。" : "Short, with no emotional burden placed on them.",
        expectedEffect: zh ? "避免继续扩大不适。" : "Avoids escalating discomfort.",
        risk: zh ? "发送后停止推进。" : "Stop pursuing after sending.",
        boundarySafe: true
      },
      {
        label: zh ? "道歉版" : "Apology",
        text: zh ? "抱歉，我刚才没有把你的感受放在前面。之后我会尊重你的选择。" : "Sorry. I did not put your comfort first. I will respect your choice from here.",
        why: zh ? "适合已经让对方不舒服的场景。" : "Useful when they already expressed discomfort.",
        expectedEffect: zh ? "修复基本尊重感。" : "Repairs basic respect.",
        risk: zh ? "不要把道歉写成挽回请求。" : "Do not turn the apology into another ask.",
        boundarySafe: true
      }
    ];
  }

  const interest = report.interestMap.strong[0] ?? (zh ? "你刚刚说的那个" : "what you mentioned");
  const styleHints: Record<ReplyStyle, { zh: string; en: string }> = {
    natural: { zh: "自然接住", en: "natural" },
    humorous: { zh: "轻松开玩笑", en: "lightly playful" },
    sincere: { zh: "真诚回应", en: "sincere" },
    restrained: { zh: "克制不压迫", en: "restrained" },
    direct: { zh: "明确但留余地", en: "direct but easy to decline" },
    gentle: { zh: "温柔低压力", en: "gentle" }
  };
  const hint = zh ? styleHints[style].zh : styleHints[style].en;

  return [
    {
      label: zh ? "稳妥版" : "Safe",
      text: zh ? `这个我有点被种草了。你说的${interest}听起来挺有画面感，哪一个最适合新手先试？` : `You kind of sold me on that. ${interest} sounds interesting. What would be the easiest place to start?`,
      why: zh ? `用${hint}的方式延续 TA 已经展开的话题。` : `Keeps the thread ${hint} around a topic they already opened.`,
      expectedEffect: zh ? "给 TA 一个容易回答的问题。" : "Gives them an easy question to answer.",
      risk: zh ? "不要连续追问太多细节。" : "Do not stack too many follow-up questions.",
      boundarySafe: true
    },
    {
      label: zh ? "轻松幽默版" : "Lightly playful",
      text: zh ? `感觉你讲${interest}的时候明显更有精神哈哈。我先记一笔，下次别嫌我问题多。` : `I can tell you get more animated talking about ${interest}. Noted. I may ask too many questions next time.`,
      why: zh ? "轻微表达关注，同时不直接施压。" : "Shows attention without pushing.",
      expectedEffect: zh ? "增加轻松感，适合暧昧或热度不错时。" : "Adds warmth when the thread is already responsive.",
      risk: zh ? "如果对方最近回复冷，就换稳妥版。" : "Use the safe version if they have been cold.",
      boundarySafe: true
    },
    {
      label: zh ? "稍微推进版" : "Slight escalation",
      text: zh ? `那我认真提个低压力方案：哪天你刚好想去看${interest}相关的东西，可以叫我，我负责不乱发表外行感想。` : `Low-pressure idea: if you ever feel like checking out something around ${interest}, I would be happy to tag along and keep my beginner takes under control.`,
      why: zh ? "把推进绑定到 TA 兴趣，并明确低压力。" : "Anchors escalation in their interest and keeps it low-pressure.",
      expectedEffect: zh ? "适合 warm 阶段试探邀约窗口。" : "Tests an invite window in a warm stage.",
      risk: zh ? "如果 TA 回避，不要追问，回到普通聊天或暂停。" : "If they dodge it, do not push; return to ordinary chat or pause.",
      boundarySafe: true
    }
  ].map((reply) => ({ ...reply, text: reply.text.replace(/\s+/g, " ").trim() }));
}

function boundaryReplyLabVariants(language: PackLanguage): ReplyLabVariant[] {
  const zh = language === "zh";
  return [
    {
      label: zh ? "尊重边界" : "Respect boundary",
      text: zh ? "明白了，刚才让你有压力的话我很抱歉。我会尊重你的边界，不再继续追问。" : "I understand. I am sorry for adding pressure. I will respect your boundary and stop asking.",
      why: zh ? "承认对方边界，不争辩也不继续推进。" : "Acknowledges the boundary without arguing or pushing.",
      expectedEffect: zh ? "体面收尾，降低对方压力。" : "Closes respectfully and lowers pressure.",
      risk: zh ? "发送后停止推进。" : "Stop pursuing after sending.",
      boundarySafe: true,
      intent: "apology",
      style: "sincere"
    },
    {
      label: zh ? "简短收尾" : "Short close",
      text: zh ? "收到，谢谢你直接告诉我。我会注意分寸，也会给你空间。" : "Got it. Thank you for being direct. I will give you space and leave it here.",
      why: zh ? "不把情绪负担转给 TA。" : "Does not put emotional labor on them.",
      expectedEffect: zh ? "避免继续扩大不适。" : "Avoids expanding the discomfort.",
      risk: zh ? "不要追加解释。" : "Do not add extra explanations.",
      boundarySafe: true,
      intent: "close",
      style: "restrained"
    },
    {
      label: zh ? "道歉修复" : "Repair apology",
      text: zh ? "抱歉，我刚才没有把你的感受放在前面。之后我会尊重你的选择。" : "Sorry. I did not put your comfort first. I will respect your choice from here.",
      why: zh ? "适合已经让对方不舒服的场景。" : "Useful when they already expressed discomfort.",
      expectedEffect: zh ? "修复基本尊重感。" : "Repairs basic respect.",
      risk: zh ? "不要把道歉写成挽回请求。" : "Do not turn the apology into another ask.",
      boundarySafe: true,
      intent: "apology",
      style: "gentle"
    }
  ];
}

function filterReplyLabVariants(variants: ReplyLabVariant[], style?: ReplyStyle, requested?: string[]): ReplyLabVariant[] {
  const requestedKinds = new Set((requested ?? []).map((item) => item.trim().toLowerCase()).filter(Boolean));
  const matchesRequested = (variant: ReplyLabVariant): boolean => {
    if (requestedKinds.size === 0) return true;
    if (requestedKinds.has(variant.intent)) return true;
    if (requestedKinds.has(variant.style)) return true;
    if (requestedKinds.has("safe") && (variant.intent === "continue" || variant.intent === "repair" || variant.intent === "close")) return true;
    if (requestedKinds.has("warm") && variant.intent === "warmth") return true;
    if (requestedKinds.has("invite") && variant.intent === "ask") return true;
    return false;
  };
  const filtered = variants.filter(matchesRequested);
  const selected = filtered.length > 0 ? filtered : variants;
  if (!style) return selected;
  return [...selected].sort((a, b) => Number(b.style === style) - Number(a.style === style));
}

export function generateReplyLab(report: PursuitReport): ReplyLab;
export function generateReplyLab(report: PursuitReport, latest: string | undefined, style?: ReplyStyle, variants?: string[]): ReplyLabVariant[];
export function generateReplyLab(report: PursuitReport, latest?: string, style?: ReplyStyle, requestedVariants?: string[]): ReplyLab | ReplyLabVariant[] {
  if (report.boundary.severity === "hard_stop" || report.strategy.action === "respect_boundary") {
    const lab = {
      allowEscalation: false,
      safetyGate: report.safety.gate,
      variants: boundaryReplyLabVariants(report.language)
    };
    return arguments.length > 1 ? filterReplyLabVariants(lab.variants, style, requestedVariants) : lab;
  }

  const zh = report.language === "zh";
  const interest = report.interestMap.strong[0] ?? (zh ? "你刚刚说的那个" : "what you mentioned");
  const allowAsk = report.safety.allowEscalation && (report.dateReadiness.verdict === "ready" || report.dateReadiness.verdict === "soft_invite_ok");
  const askText = allowAsk
    ? report.dateReadiness.suggestedAsk
    : (zh ? `先不急着约，继续听你讲${interest}这个就挺有意思。` : `No rush to make plans; I am interested in hearing more about ${interest}.`);
  const askIntent: ReplyLabIntent = allowAsk ? "ask" : "continue";

  const variants: ReplyLabVariant[] = [
    {
      label: zh ? "自然接住" : "Natural follow-up",
      text: zh ? `你说的${interest}我还挺想继续听的，哪个部分最容易入门？` : `I am curious about ${interest}. What is the easiest way to get into it?`,
      why: zh ? "围绕 TA 已经展开的兴趣继续。" : "Continues around an interest they already opened.",
      expectedEffect: zh ? "给 TA 一个容易回答的问题。" : "Gives them an easy question to answer.",
      risk: zh ? "不要连续追问。" : "Do not stack follow-up questions.",
      boundarySafe: true,
      intent: "continue",
      style: "natural"
    },
    {
      label: zh ? "轻松回应" : "Light warmth",
      text: zh ? `你讲${interest}的时候明显很有画面感哈哈，我先记下。` : `You make ${interest} sound pretty vivid. I am noting that down.`,
      why: zh ? "表达关注，但不直接施压。" : "Shows attention without pressure.",
      expectedEffect: zh ? "增加轻松感。" : "Adds light warmth.",
      risk: zh ? "如果 TA 最近冷淡，就换更克制的版本。" : "Use a more restrained version if they have been cold.",
      boundarySafe: true,
      intent: "warmth",
      style: "humorous"
    },
    {
      label: zh ? "真诚版" : "Sincere",
      text: zh ? `我喜欢你刚才那个说法，感觉你是真的认真喜欢${interest}。` : `I liked how you put that. It sounds like you genuinely care about ${interest}.`,
      why: zh ? "回应具体内容，而不是空泛夸赞。" : "Responds to specific content instead of generic praise.",
      expectedEffect: zh ? "让对方感觉被认真听见。" : "Makes the other person feel heard.",
      risk: zh ? "语气保持轻，不要突然表白。" : "Keep it light; do not turn it into a confession.",
      boundarySafe: true,
      intent: "warmth",
      style: "sincere"
    },
    {
      label: allowAsk ? (zh ? "低压力邀约" : "Low-pressure invite") : (zh ? "不推进版" : "No-escalation version"),
      text: askText,
      why: allowAsk
        ? (zh ? "当前有邀约窗口，但仍保留拒绝空间。" : "There is an invite window, while still leaving an easy out.")
        : (zh ? "安全门不支持推进时，继续轻量互动。" : "Keeps the interaction light when the safety gate does not support escalation."),
      expectedEffect: allowAsk
        ? (zh ? "试探线下窗口。" : "Tests the offline window.")
        : (zh ? "维持舒适度。" : "Preserves comfort."),
      risk: allowAsk
        ? (zh ? "如果 TA 回避，立刻降回普通聊天。" : "If they dodge it, drop back to normal chat.")
        : (zh ? "不要把它改写成邀约。" : "Do not rewrite it into an invite."),
      boundarySafe: true,
      intent: askIntent,
      style: "direct"
    },
    {
      label: zh ? "克制留白" : "Restrained pause",
      text: zh ? "我先不疯狂追问了，你有空再慢慢说。" : "I will not overload you with questions. Tell me more whenever you feel like it.",
      why: zh ? "给对方节奏空间。" : "Gives them control of the pace.",
      expectedEffect: zh ? "降低聊天负担。" : "Lowers conversational burden.",
      risk: zh ? "不要随后立刻补第二条。" : "Do not immediately add another message.",
      boundarySafe: true,
      intent: "repair",
      style: "restrained"
    }
  ];

  const lab = {
    allowEscalation: report.safety.allowEscalation,
    safetyGate: report.safety.gate,
    variants: variants.map((reply) => ({ ...reply, text: reply.text.replace(/\s+/g, " ").trim() }))
  };
  return arguments.length > 1 ? filterReplyLabVariants(lab.variants, style, requestedVariants) : lab;
}

export function assessSendDecision(report: PursuitReport, draft = ""): SendDecision {
  return decideSend(
    {
      language: report.language,
      boundary: report.boundary,
      stage: report.stage,
      action: report.strategy.action,
      dateReadiness: report.dateReadiness,
      safety: report.safety
    },
    draft
  );
}

export function generateTopicPlan(report: PursuitReport): TopicPlan {
  const zh = report.language === "zh";
  const interests = report.interestMap.strong.length > 0 ? report.interestMap.strong : zh ? ["最近看的东西", "咖啡", "周末安排"] : ["recent interests", "coffee", "weekend plans"];
  const lowRiskBase = zh
    ? ["最近有没有看到值得推荐的店", "这周有什么让你开心的小事", "最近通勤/上课/工作顺不顺", "有没有一首循环的歌", "周末想安静点还是热闹点", "最近看过最有意思的短视频", "有没有想吃但还没去吃的东西", "最近天气适合做什么", "有没有重新喜欢上的老东西", "今天有没有一个还不错的瞬间"]
    : ["Any place worth recommending lately?", "What was a small good thing this week?", "How has work or study been?", "Any song on repeat?", "Quiet weekend or lively weekend?", "Anything surprisingly fun you watched?", "Any food you have been meaning to try?", "What does this weather make you want to do?", "Any old interest coming back?", "What was one decent moment today?"];
  const interestBasedTopics = interests.slice(0, 5).map((interest) =>
    zh ? `围绕「${interest}」问一个新手入口：从哪里开始最不踩雷？` : `Ask for a beginner entry point into ${interest}.`
  );
  const inviteTopics = interests.slice(0, 3).map((interest) =>
    zh ? `如果 TA 对「${interest}」继续展开，可以用“下次刚好想去可以叫我”低压力邀约。` : `If they keep expanding on ${interest}, use a low-pressure "I could join if you feel like it" invite.`
  );
  const avoidTopics = report.safety.boundaryDetected
    ? zh ? ["继续邀约", "解释自己为什么喜欢 TA", "追问 TA 为什么拒绝"] : ["more invites", "explaining why you like them", "asking why they refused"]
    : zh ? ["连续查户口", "评价前任", "过早聊排他关系", "用冷淡测试 TA"] : ["interrogation-style questions", "judging exes", "premature exclusivity talk", "testing with coldness"];
  const boundaries = zh
    ? ["TA 明确拒绝时停止推进。", "回复建议只能帮助表达真实想法，不能操控对方。", "不要为了追求制造焦虑或嫉妒。"]
    : ["Stop escalating after explicit refusal.", "Reply suggestions help express real intent; they are not manipulation scripts.", "Do not create anxiety or jealousy as a tactic."];
  const markdown = `# topic_plan\n\n## Low-risk topics\n${lowRiskBase.map((topic) => `- ${topic}`).join("\n")}\n\n## Interest-based topics\n${interestBasedTopics.map((topic) => `- ${topic}`).join("\n")}\n\n## Invite windows\n${inviteTopics.map((topic) => `- ${topic}`).join("\n")}\n\n## Avoid\n${avoidTopics.map((topic) => `- ${topic}`).join("\n")}\n\n## Boundaries\n${boundaries.map((topic) => `- ${topic}`).join("\n")}\n`;

  return {
    lowRiskTopics: lowRiskBase,
    interestBasedTopics,
    inviteTopics,
    avoidTopics,
    boundaries,
    markdown
  };
}

export function renderPursuitReport(report: PursuitReport): string {
  return `# pursuit_report\n\n## Stage\n${report.stage} (${Math.round(report.confidence * 100)}% confidence)\n\n## Communication Style\n- Sentence length: ${report.communicationStyle.sentenceLength}\n- Initiative: ${report.communicationStyle.initiative}\n- Rhythm: ${report.communicationStyle.replyRhythm}\n- Tone: ${report.communicationStyle.tone.join(", ")}\n\n## Interest Map\n- Strong: ${report.interestMap.strong.join(", ") || "not enough evidence"}\n- Possible: ${report.interestMap.possible.join(", ") || "not enough evidence"}\n- Avoid: ${report.interestMap.avoid.join(", ") || "none detected"}\n\n## Warmth Signals\n${report.warmthSignals.map((item) => `- "${item.quote}" -> ${item.claim} (${Math.round(item.confidence * 100)}%)`).join("\n") || "- No strong warmth signal yet."}\n\n## Risk Signals\n${report.riskSignals.map((item) => `- "${item.quote}" -> ${item.claim} (${Math.round(item.confidence * 100)}%)`).join("\n") || "- No strong risk signal yet."}\n\n## Current Best Strategy\n- Action: ${report.strategy.action}\n- Summary: ${report.strategy.summary}\n- Next move: ${report.strategy.nextMove}\n\n## Safety\n${report.safety.nonManipulation.map((item) => `- ${item}`).join("\n")}\n`;
}

export function renderReplies(replies: ReplySuggestion[]): string {
  return replies
    .map((reply) => `## ${reply.label}\n${reply.text}\n\n- Why: ${reply.why}\n- Expected effect: ${reply.expectedEffect}\n- Risk: ${reply.risk}\n`)
    .join("\n");
}
