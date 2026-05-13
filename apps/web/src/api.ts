export const packTypes = ["relationship", "character", "advisor", "self", "pursuit"] as const;
export type PersonaType = (typeof packTypes)[number];

export const packLanguages = ["zh", "en", "ja", "ko", "es"] as const;
export type PackLanguage = (typeof packLanguages)[number];

export const exportTargets = ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"] as const;
export type ExportTarget = (typeof exportTargets)[number];

export const pursuitGoals = ["break_ice", "continue_chat", "ask_out", "judge_chance", "recover_cold_chat", "write_reply"] as const;
export type PursuitGoal = (typeof pursuitGoals)[number];

export const replyStyles = ["natural", "humorous", "sincere", "restrained", "direct", "gentle"] as const;
export type ReplyStyle = (typeof replyStyles)[number];

export type PackSummary = {
  id: string;
  name: string;
  type: PersonaType;
  language: PackLanguage;
  sourceCount?: number;
  reportCount?: number;
  exportCount?: number;
  updatedAt?: string;
  createdAt?: string;
};

export type ParsePreviewMessage = {
  speaker: string;
  text: string;
  timestamp?: string;
};

export type ParsePreview = {
  sourceCount?: number;
  duplicateCount?: number;
  sourceName?: string;
  summary?: string;
  messages: ParsePreviewMessage[];
};

export type EvidenceItem = {
  id?: string;
  quote: string;
  claim: string;
  confidence?: number;
  kind?: string;
};

export type PursuitReport = {
  id?: string;
  language?: PackLanguage;
  stage: string;
  goal?: PursuitGoal;
  confidence: number;
  communicationStyle: {
    sentenceLength: string;
    initiative: string;
    tone: string[];
    replyRhythm: string;
  };
  interestMap: {
    strong: string[];
    possible: string[];
    avoid: string[];
  };
  warmthSignals: EvidenceItem[];
  riskSignals: EvidenceItem[];
  strategy: {
    action: string;
    summary: string;
    nextMove: string;
  };
  evidence: EvidenceItem[];
  safety: {
    boundaryDetected: boolean;
    nonManipulation: string[];
    allowEscalation?: boolean;
    gate?: string;
  };
};

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
  markdown?: string;
};

export type PromptLayer = {
  name: string;
  role?: string;
  content: string;
  source?: string;
  tokensEstimate?: number;
};

export type PromptStack = {
  packId?: string;
  layers: PromptLayer[];
  rendered?: string;
  tokensEstimate?: number;
};

export type ImportInput = {
  packName: string;
  type: PersonaType;
  language: PackLanguage;
  consentConfirmed: boolean;
  files: File[];
};

export type ImportResult = {
  packId: string;
  sourceCount: number;
  duplicateCount: number;
  preview?: ParsePreview;
  pack?: PackSummary;
};

export type PasteInput = {
  text: string;
  name: string;
  consentConfirmed: boolean;
};

export type PasteResult = {
  sourceCount: number;
  duplicateCount: number;
  preview?: ParsePreview;
  pack?: PackSummary;
};

export type CreatePackInput = {
  name: string;
  type: PersonaType;
  language: PackLanguage;
};

export type PursuitInput = {
  me: string;
  ta: string;
  goal: PursuitGoal;
  latest: string;
  style: ReplyStyle;
};

export type PursuitResult = {
  reportId: string;
  report: PursuitReport;
  replies: ReplySuggestion[];
  topicPlan?: TopicPlan;
  promptStack?: PromptStack;
};

export type ReplyLabResult = {
  replies: ReplySuggestion[];
  report?: PursuitReport;
};

export type ExportResult = {
  exportId: string;
  target?: ExportTarget;
};

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function enumValue<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value) ? value : fallback;
}

function optionalEnumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | undefined {
  return typeof value === "string" && values.includes(value) ? value : undefined;
}

function unwrapEnvelope(value: unknown): unknown {
  if (!isRecord(value)) return value;
  if (value.ok === false) {
    throw new Error(stringValue(value.error) ?? stringValue(value.message) ?? "API request failed");
  }
  return "data" in value ? value.data : value;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Request failed with ${response.status}`);
  }
  if (text.length === 0) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Local API did not return JSON at /api");
  }
  try {
    return unwrapEnvelope(JSON.parse(text) as unknown);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("API returned invalid JSON");
    }
    throw error;
  }
}

async function requestJson(fetcher: Fetcher, input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  return readJson(await fetcher(input, init));
}

async function requestBlob(fetcher: Fetcher, input: RequestInfo | URL): Promise<Blob> {
  const response = await fetcher(input);
  if (!response.ok) {
    throw new Error((await response.text()) || `Download failed with ${response.status}`);
  }
  return response.blob();
}

function normalizePack(value: unknown): PackSummary | undefined {
  if (!isRecord(value)) return undefined;
  const id = stringValue(value.id) ?? stringValue(value.packId);
  const name = stringValue(value.name) ?? stringValue(value.packName);
  if (!id || !name) return undefined;

  const pack: PackSummary = {
    id,
    name,
    type: enumValue(value.type, packTypes, "relationship"),
    language: enumValue(value.language, packLanguages, "zh")
  };
  const sourceCount = numberValue(value.sourceCount);
  const reportCount = numberValue(value.reportCount);
  const exportCount = numberValue(value.exportCount);
  const updatedAt = stringValue(value.updatedAt);
  const createdAt = stringValue(value.createdAt);
  if (sourceCount !== undefined) pack.sourceCount = sourceCount;
  if (reportCount !== undefined) pack.reportCount = reportCount;
  if (exportCount !== undefined) pack.exportCount = exportCount;
  if (updatedAt !== undefined) pack.updatedAt = updatedAt;
  if (createdAt !== undefined) pack.createdAt = createdAt;
  return pack;
}

function normalizeMessage(value: unknown): ParsePreviewMessage | undefined {
  if (!isRecord(value)) return undefined;
  const text = stringValue(value.text) ?? stringValue(value.message) ?? stringValue(value.content);
  if (!text) return undefined;
  const message: ParsePreviewMessage = {
    speaker: stringValue(value.speaker) ?? stringValue(value.sender) ?? stringValue(value.from) ?? "unknown",
    text
  };
  const timestamp = stringValue(value.timestamp);
  if (timestamp !== undefined) message.timestamp = timestamp;
  return message;
}

function normalizePreview(value: unknown): ParsePreview | undefined {
  if (!isRecord(value)) return undefined;
  const nested = isRecord(value.preview)
    ? value.preview
    : isRecord(value.parsePreview)
      ? value.parsePreview
      : isRecord(value.parsed)
        ? value.parsed
        : value;

  const source = isRecord(nested.source) ? nested.source : isRecord(value.source) ? value.source : undefined;
  const rawMessages = Array.isArray(nested.messages)
    ? nested.messages
    : Array.isArray(value.messages)
      ? value.messages
      : Array.isArray(nested.previewMessages)
        ? nested.previewMessages
        : [];
  const messages = rawMessages.map(normalizeMessage).filter((item): item is ParsePreviewMessage => item !== undefined).slice(0, 8);
  const summary = stringValue(nested.summary) ?? stringValue(value.summary) ?? (source ? stringValue(source.summary) : undefined);
  const sourceName = stringValue(nested.sourceName) ?? (source ? stringValue(source.name) : undefined);
  const sourceCount = numberValue(value.sourceCount) ?? numberValue(nested.sourceCount);
  const duplicateCount = numberValue(value.duplicateCount) ?? numberValue(nested.duplicateCount);

  if (messages.length === 0 && summary === undefined && sourceName === undefined && sourceCount === undefined && duplicateCount === undefined) {
    return undefined;
  }

  const preview: ParsePreview = { messages };
  if (sourceCount !== undefined) preview.sourceCount = sourceCount;
  if (duplicateCount !== undefined) preview.duplicateCount = duplicateCount;
  if (sourceName !== undefined) preview.sourceName = sourceName;
  if (summary !== undefined) preview.summary = summary;
  return preview;
}

function normalizeEvidence(value: unknown): EvidenceItem | undefined {
  if (!isRecord(value)) return undefined;
  const quote = stringValue(value.quote) ?? stringValue(value.text);
  const claim = stringValue(value.claim) ?? stringValue(value.label);
  if (!quote || !claim) return undefined;
  const item: EvidenceItem = { quote, claim };
  const id = stringValue(value.id);
  const kind = stringValue(value.kind);
  const confidence = numberValue(value.confidence);
  if (id !== undefined) item.id = id;
  if (kind !== undefined) item.kind = kind;
  if (confidence !== undefined) item.confidence = confidence;
  return item;
}

function normalizeEvidenceList(value: unknown): EvidenceItem[] {
  return Array.isArray(value) ? value.map(normalizeEvidence).filter((item): item is EvidenceItem => item !== undefined) : [];
}

function normalizeReport(value: unknown): PursuitReport {
  const record = isRecord(value) ? value : {};
  const style = isRecord(record.communicationStyle) ? record.communicationStyle : {};
  const interestMap = isRecord(record.interestMap) ? record.interestMap : {};
  const strategy = isRecord(record.strategy) ? record.strategy : {};
  const safety = isRecord(record.safety) ? record.safety : {};
  const report: PursuitReport = {
    stage: stringValue(record.stage) ?? "unknown",
    confidence: numberValue(record.confidence) ?? 0,
    communicationStyle: {
      sentenceLength: stringValue(style.sentenceLength) ?? "unknown",
      initiative: stringValue(style.initiative) ?? "unknown",
      tone: stringList(style.tone),
      replyRhythm: stringValue(style.replyRhythm) ?? "unknown"
    },
    interestMap: {
      strong: stringList(interestMap.strong),
      possible: stringList(interestMap.possible),
      avoid: stringList(interestMap.avoid)
    },
    warmthSignals: normalizeEvidenceList(record.warmthSignals),
    riskSignals: normalizeEvidenceList(record.riskSignals),
    strategy: {
      action: stringValue(strategy.action) ?? "unknown",
      summary: stringValue(strategy.summary) ?? "",
      nextMove: stringValue(strategy.nextMove) ?? ""
    },
    evidence: normalizeEvidenceList(record.evidence),
    safety: {
      boundaryDetected: booleanValue(safety.boundaryDetected) ?? false,
      nonManipulation: stringList(safety.nonManipulation)
    }
  };
  const id = stringValue(record.id);
  const language = optionalEnumValue(record.language, packLanguages);
  const goal = optionalEnumValue(record.goal, pursuitGoals);
  const allowEscalation = booleanValue(safety.allowEscalation);
  const gate = stringValue(safety.gate);
  if (id !== undefined) report.id = id;
  if (language !== undefined) report.language = language;
  if (goal !== undefined) report.goal = goal;
  if (allowEscalation !== undefined) report.safety.allowEscalation = allowEscalation;
  if (gate !== undefined) report.safety.gate = gate;
  return report;
}

function normalizeReply(value: unknown): ReplySuggestion | undefined {
  if (!isRecord(value)) return undefined;
  const label = stringValue(value.label) ?? stringValue(value.title);
  const text = stringValue(value.text) ?? stringValue(value.reply);
  if (!label || !text) return undefined;
  return {
    label,
    text,
    why: stringValue(value.why) ?? "",
    expectedEffect: stringValue(value.expectedEffect) ?? "",
    risk: stringValue(value.risk) ?? "",
    boundarySafe: booleanValue(value.boundarySafe) ?? true
  };
}

function normalizeReplies(value: unknown): ReplySuggestion[] {
  return Array.isArray(value) ? value.map(normalizeReply).filter((item): item is ReplySuggestion => item !== undefined) : [];
}

function normalizeTopicPlan(value: unknown): TopicPlan | undefined {
  if (!isRecord(value)) return undefined;
  const plan: TopicPlan = {
    lowRiskTopics: stringList(value.lowRiskTopics),
    interestBasedTopics: stringList(value.interestBasedTopics),
    inviteTopics: stringList(value.inviteTopics),
    avoidTopics: stringList(value.avoidTopics),
    boundaries: stringList(value.boundaries)
  };
  const markdown = stringValue(value.markdown);
  if (markdown !== undefined) plan.markdown = markdown;
  return plan;
}

function normalizePromptStack(value: unknown): PromptStack | undefined {
  if (!isRecord(value)) return undefined;
  const layers = Array.isArray(value.layers)
    ? value.layers
      .map((layer): PromptLayer | undefined => {
        if (!isRecord(layer)) return undefined;
        const name = stringValue(layer.name);
        const content = stringValue(layer.content);
        if (!name || !content) return undefined;
        const promptLayer: PromptLayer = { name, content };
        const role = stringValue(layer.role);
        const source = stringValue(layer.source);
        const tokensEstimate = numberValue(layer.tokensEstimate);
        if (role !== undefined) promptLayer.role = role;
        if (source !== undefined) promptLayer.source = source;
        if (tokensEstimate !== undefined) promptLayer.tokensEstimate = tokensEstimate;
        return promptLayer;
      })
      .filter((layer): layer is PromptLayer => layer !== undefined)
    : [];
  if (layers.length === 0) return undefined;
  const stack: PromptStack = { layers };
  const packId = stringValue(value.packId);
  const rendered = stringValue(value.rendered);
  const tokensEstimate = numberValue(value.tokensEstimate);
  if (packId !== undefined) stack.packId = packId;
  if (rendered !== undefined) stack.rendered = rendered;
  if (tokensEstimate !== undefined) stack.tokensEstimate = tokensEstimate;
  return stack;
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}

function normalizeImportResult(value: unknown): ImportResult {
  const record = isRecord(value) ? value : {};
  const packRecord = normalizePack(record.pack);
  const packId = stringValue(record.packId) ?? stringValue(record.id) ?? packRecord?.id ?? "";
  const preview = normalizePreview(record);
  const result: ImportResult = {
    packId,
    sourceCount: numberValue(record.sourceCount) ?? preview?.sourceCount ?? 0,
    duplicateCount: numberValue(record.duplicateCount) ?? preview?.duplicateCount ?? 0
  };
  if (preview !== undefined) result.preview = preview;
  if (packRecord !== undefined) result.pack = packRecord;
  return result;
}

function normalizePasteResult(value: unknown): PasteResult {
  const record = isRecord(value) ? value : {};
  const preview = normalizePreview(record);
  const pack = normalizePack(record.pack);
  const result: PasteResult = {
    sourceCount: numberValue(record.sourceCount) ?? preview?.sourceCount ?? 0,
    duplicateCount: numberValue(record.duplicateCount) ?? preview?.duplicateCount ?? 0
  };
  if (preview !== undefined) result.preview = preview;
  if (pack !== undefined) result.pack = pack;
  return result;
}

function normalizePursuitResult(value: unknown): PursuitResult {
  const record = isRecord(value) ? value : {};
  const report = normalizeReport(record.report);
  const topicPlan = normalizeTopicPlan(record.topicPlan ?? record.topics);
  const promptStack = normalizePromptStack(record.promptStack ?? record.stack);
  const result: PursuitResult = {
    reportId: stringValue(record.reportId) ?? report.id ?? "",
    report,
    replies: normalizeReplies(record.replies ?? record.replySuggestions)
  };
  if (topicPlan !== undefined) result.topicPlan = topicPlan;
  if (promptStack !== undefined) result.promptStack = promptStack;
  return result;
}

function normalizeReplyLabResult(value: unknown): ReplyLabResult {
  const record = isRecord(value) ? value : {};
  const report = "report" in record ? normalizeReport(record.report) : undefined;
  const result: ReplyLabResult = {
    replies: normalizeReplies(record.replies ?? record.replySuggestions)
  };
  if (report !== undefined) result.report = report;
  return result;
}

function normalizeExportResult(value: unknown): ExportResult {
  const record = isRecord(value) ? value : {};
  const result: ExportResult = {
    exportId: stringValue(record.exportId) ?? stringValue(record.id) ?? ""
  };
  const target = optionalEnumValue(record.target, exportTargets);
  if (target !== undefined) result.target = target;
  return result;
}

export function createApiClient(fetcher: Fetcher = (input, init) => fetch(input, init)) {
  return {
    async listPacks(): Promise<PackSummary[]> {
      const data = await requestJson(fetcher, "/api/packs");
      const rawPacks = Array.isArray(data)
        ? data
        : isRecord(data) && Array.isArray(data.packs)
          ? data.packs
          : isRecord(data) && Array.isArray(data.items)
            ? data.items
            : [];
      return rawPacks.map(normalizePack).filter((pack): pack is PackSummary => pack !== undefined);
    },

    async createPack(input: CreatePackInput): Promise<PackSummary> {
      const data = await requestJson(fetcher, "/api/packs", jsonInit(input));
      const pack = normalizePack(data);
      if (pack) return pack;
      if (isRecord(data)) {
        return {
          id: stringValue(data.id) ?? stringValue(data.packId) ?? "",
          name: input.name,
          type: input.type,
          language: input.language
        };
      }
      return { id: "", name: input.name, type: input.type, language: input.language };
    },

    async uploadImport(input: ImportInput): Promise<ImportResult> {
      const form = new FormData();
      form.set("packName", input.packName);
      form.set("type", input.type);
      form.set("language", input.language);
      form.set("consentConfirmed", String(input.consentConfirmed));
      input.files.forEach((file) => form.append("files", file));
      return normalizeImportResult(await requestJson(fetcher, "/api/imports", { method: "POST", body: form }));
    },

    async pasteSource(packId: string, input: PasteInput): Promise<PasteResult> {
      return normalizePasteResult(await requestJson(fetcher, `/api/packs/${packId}/pastes`, jsonInit(input)));
    },

    async createPursuitReport(packId: string, input: PursuitInput): Promise<PursuitResult> {
      return normalizePursuitResult(await requestJson(fetcher, `/api/packs/${packId}/pursuit`, jsonInit(input)));
    },

    async createReplySuggestions(packId: string, input: PursuitInput & { reportId?: string }): Promise<ReplyLabResult> {
      return normalizeReplyLabResult(await requestJson(fetcher, `/api/packs/${packId}/replies`, jsonInit(input)));
    },

    async createExport(packId: string, target: ExportTarget): Promise<ExportResult> {
      return normalizeExportResult(await requestJson(fetcher, `/api/packs/${packId}/exports`, jsonInit({ target })));
    },

    async downloadReport(reportId: string): Promise<Blob> {
      return requestBlob(fetcher, `/api/reports/${reportId}/download`);
    },

    async downloadExport(exportId: string): Promise<Blob> {
      return requestBlob(fetcher, `/api/exports/${exportId}/download`);
    }
  };
}
