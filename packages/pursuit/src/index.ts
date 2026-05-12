import { createId, nowIso, stableHash, type Evidence, type PackLanguage } from "../../core/src/index.ts";
import type { ChatMessage } from "../../importers/src/index.ts";

export type PursuitGoal =
  | "break_ice"
  | "continue_chat"
  | "ask_out"
  | "judge_chance"
  | "recover_cold_chat"
  | "write_reply";

export type PursuitStage = "stranger" | "early" | "warm" | "ambiguous" | "cold" | "stable" | "risk" | "boundary";

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
  safety: {
    boundaryDetected: boolean;
    nonManipulation: string[];
  };
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

export type TopicPlan = {
  lowRiskTopics: string[];
  interestBasedTopics: string[];
  inviteTopics: string[];
  avoidTopics: string[];
  boundaries: string[];
  markdown: string;
};

type PursuitOptions = {
  userName: string;
  targetName: string;
  goal: PursuitGoal;
  language?: PackLanguage;
};

const zhRejection = ["别再", "不要再", "不想聊", "别问", "算了", "没兴趣", "别联系", "请尊重", "不舒服", "拒绝"];
const enRejection = ["stop asking", "not interested", "don't want", "do not want", "please respect", "uncomfortable", "leave me alone", "no thanks"];
const zhCold = ["哦", "嗯", "随便", "再说", "不知道", "忙", "呵呵"];
const enCold = ["ok", "k", "busy", "maybe", "idk", "not sure"];
const zhWarm = ["哈哈", "！", "?", "？", "你呢", "你也", "下次", "周末", "可以", "有意思", "喜欢"];
const enWarm = ["haha", "lol", "you?", "what about you", "weekend", "maybe we", "sounds fun", "interesting"];

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
    createdAt: nowIso()
  };
}

function containsAny(text: string, needles: string[]): boolean {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
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

  const warmthSignals = target
    .filter((message) => containsAny(message.text, warmTerms) || /[?？]/.test(message.text))
    .map((message) => evidenceFromMessage(sourceId, message, language === "zh" ? "TA 主动展开或接话" : "Target opens or extends the conversation", 0.78));
  const riskSignals = target
    .filter((message) => containsAny(message.text, rejectionTerms) || containsAny(message.text, coldTerms))
    .map((message) => evidenceFromMessage(sourceId, message, language === "zh" ? "TA 表达拒绝、冷淡或压力" : "Target signals refusal, coldness, or pressure", 0.86));
  const boundaryDetected = target.some((message) => containsAny(message.text, rejectionTerms));
  const coldCount = target.filter((message) => containsAny(message.text, coldTerms)).length;
  const initiativeRatio = messages.length > 0 ? target.filter((message) => /[?？]/.test(message.text)).length / Math.max(1, user.length) : 0;
  const targetAverage = averageLength(target);
  const interests = extractInterests(messages);

  let stage: PursuitStage = "early";
  if (boundaryDetected) stage = "boundary";
  else if (target.length <= 1) stage = "stranger";
  else if (coldCount >= Math.max(2, target.length / 2)) stage = "cold";
  else if (warmthSignals.length >= 2 && initiativeRatio > 0.2) stage = "warm";
  else if (warmthSignals.length >= 3) stage = "stable";
  else if (riskSignals.length > 0) stage = "risk";
  else stage = "ambiguous";

  let action: PursuitReport["strategy"]["action"] = "continue_lightly";
  if (stage === "boundary") action = "respect_boundary";
  else if (stage === "cold") action = options.goal === "recover_cold_chat" ? "pause" : "change_topic";
  else if (stage === "risk") action = "pause";
  else if (stage === "warm" && options.goal === "ask_out") action = "soft_invite";
  else if (stage === "warm" || stage === "stable") action = "continue_lightly";

  const strategy = actionSummary(language, action);
  const allEvidence = [...warmthSignals, ...riskSignals];

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
      avoid: boundaryDetected ? (language === "zh" ? ["继续邀约", "追问拒绝原因", "情绪施压"] : ["more invites", "asking why they refused", "emotional pressure"]) : []
    },
    warmthSignals,
    riskSignals,
    strategy: {
      action,
      ...strategy
    },
    evidence: allEvidence,
    safety: {
      boundaryDetected,
      nonManipulation: language === "zh"
        ? ["不制造焦虑", "不绕过拒绝", "不冒充他人", "不诱导隐私"]
        : ["no anxiety games", "no bypassing refusal", "no impersonation", "no privacy extraction"]
    }
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
