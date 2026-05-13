import React, { type ChangeEvent, type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  AtSign,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  FileArchive,
  FileText,
  HeartHandshake,
  ImageUp,
  Inbox,
  Layers3,
  Loader2,
  Mic,
  MicOff,
  MessageCircle,
  MessageCircleHeart,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Volume2,
  WandSparkles,
  X
} from "lucide-react";
import {
  createApiClient,
  exportTargets,
  packLanguages,
  replyStyles,
  type ExportTarget,
  type PackLanguage,
  type PackSummary,
  type ParsePreview,
  type PersonaType,
  type PursuitGoal,
  type PursuitReport,
  type ReplyStyle,
  type ReplySuggestion,
  type TopicPlan,
  type VoiceProviderInfo
} from "./api.ts";
import "./styles.css";

const api = createApiClient();

type StatusTone = "neutral" | "busy" | "success" | "error";
type Status = { tone: StatusTone; message: string };

const workflows: Array<{ id: PersonaType; icon: React.ReactNode; title: string; subline: string }> = [
  { id: "pursuit", icon: <MessageCircleHeart size={19} />, title: "Crush Coach", subline: "DM heat + safe replies" },
  { id: "relationship", icon: <HeartHandshake size={19} />, title: "Relationship", subline: "Memory from chat history" },
  { id: "character", icon: <Sparkles size={19} />, title: "Character", subline: "World and persona card" },
  { id: "advisor", icon: <Bot size={19} />, title: "Life Mentor", subline: "Public notes + mental models" }
];

const goals: Array<{ value: PursuitGoal; label: string }> = [
  { value: "break_ice", label: "Break ice" },
  { value: "continue_chat", label: "Continue chat" },
  { value: "ask_out", label: "Ask out" },
  { value: "judge_chance", label: "Judge chance" },
  { value: "recover_cold_chat", label: "Recover cold chat" },
  { value: "write_reply", label: "Write reply" }
];

const styleLabels: Record<ReplyStyle, string> = {
  natural: "Natural",
  humorous: "Humorous",
  sincere: "Sincere",
  restrained: "Restrained",
  direct: "Direct",
  gentle: "Gentle"
};

const languageLabels: Record<PackLanguage, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  es: "Español"
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected API error";
}

function upsertPack(packs: PackSummary[], pack: PackSummary): PackSummary[] {
  return [pack, ...packs.filter((item) => item.id !== pack.id)];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | undefined): string {
  if (!value) return "fresh";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function safeFilename(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "kskill-pack";
}

function isVoiceLike(file: File): boolean {
  return file.type.startsWith("audio/") || /\.(wav|mp3|m4a|aac|ogg|webm|flac)$/i.test(file.name);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function stageClass(stage: string): string {
  return stage.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

function confidencePercent(report: PursuitReport | null): number {
  if (!report) return 0;
  return Math.max(0, Math.min(100, Math.round(report.confidence * 100)));
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [activePackId, setActivePackId] = useState("");
  const [workflow, setWorkflow] = useState<PersonaType>("pursuit");
  const [language, setLanguage] = useState<PackLanguage>("zh");
  const [packName, setPackName] = useState("K.skill DM Pack");
  const [consentConfirmed, setConsentConfirmed] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [intakeMode, setIntakeMode] = useState<"files" | "paste" | "record" | "media">("files");
  const [voiceProviders, setVoiceProviders] = useState<VoiceProviderInfo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaNotice, setMediaNotice] = useState("Text, voice notes, screenshots, stickers, PDFs, video transcripts, and ZIP bundles stay in the local vault.");
  const [isDragging, setIsDragging] = useState(false);
  const [pasteName, setPasteName] = useState("dm-paste.txt");
  const [pasteText, setPasteText] = useState("");
  const [preview, setPreview] = useState<ParsePreview | null>(null);
  const [me, setMe] = useState("我");
  const [ta, setTa] = useState("TA");
  const [goal, setGoal] = useState<PursuitGoal>("ask_out");
  const [latest, setLatest] = useState("周末可能去 你也喜欢这种吗？");
  const [replyStyle, setReplyStyle] = useState<ReplyStyle>("natural");
  const [report, setReport] = useState<PursuitReport | null>(null);
  const [reportId, setReportId] = useState("");
  const [replies, setReplies] = useState<ReplySuggestion[]>([]);
  const [topicPlan, setTopicPlan] = useState<TopicPlan | null>(null);
  const [exportTarget, setExportTarget] = useState<ExportTarget>("sillytavern");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ tone: "neutral", message: "Local API ready at /api" });

  const activePack = useMemo(() => packs.find((pack) => pack.id === activePackId) ?? null, [activePackId, packs]);
  const currentPackName = activePack?.name ?? (packName.trim() || "Untitled pack");
  const canUpload = files.length > 0 && packName.trim().length > 0 && consentConfirmed && busyAction === null;
  const canPaste = pasteText.trim().length > 0 && packName.trim().length > 0 && consentConfirmed && busyAction === null;
  const canRunPursuit = (activePackId.length > 0 || pasteText.trim().length > 0 || files.length > 0) && busyAction === null;
  const canDownloadReport = reportId.length > 0 && busyAction === null;
  const reportConfidence = confidencePercent(report);
  const asrProvider = useMemo(() => voiceProviders.find((provider) => provider.kind === "asr" && provider.configured) ?? voiceProviders.find((provider) => provider.kind === "asr"), [voiceProviders]);
  const ttsProvider = useMemo(() => voiceProviders.find((provider) => provider.kind === "tts" && provider.configured) ?? voiceProviders.find((provider) => provider.kind === "tts"), [voiceProviders]);

  const refreshPacks = useCallback(async (quiet = false) => {
    if (!quiet) setStatus({ tone: "busy", message: "Refreshing pack vault" });
    try {
      const next = await api.listPacks();
      setPacks(next);
      setActivePackId((current) => current || next[0]?.id || "");
      if (!quiet) setStatus({ tone: "success", message: `Loaded ${next.length} pack${next.length === 1 ? "" : "s"}` });
    } catch (error) {
      setStatus({ tone: "error", message: errorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void refreshPacks(true);
  }, [refreshPacks]);

  useEffect(() => {
    api.listVoiceProviders()
      .then(setVoiceProviders)
      .catch((error: unknown) => {
        setMediaNotice(`Voice Studio provider list unavailable: ${errorMessage(error)}`);
      });
  }, []);

  const ensureActivePack = useCallback(async (): Promise<string> => {
    if (activePackId) return activePackId;
    const created = await api.createPack({
      name: packName.trim() || "Untitled K.skill Pack",
      type: workflow,
      language
    });
    if (!created.id) throw new Error("API did not return a pack id");
    setPacks((current) => upsertPack(current, created));
    setActivePackId(created.id);
    return created.id;
  }, [activePackId, language, packName, workflow]);

  function addFiles(nextFiles: File[]): void {
    if (nextFiles.length === 0) return;
    setFiles((current) => [...current, ...nextFiles]);
    setStatus({ tone: "neutral", message: `${nextFiles.length} file${nextFiles.length === 1 ? "" : "s"} staged for multimodal import` });
  }

  async function transcribeVoiceNote(file: File, fillLatest = true): Promise<void> {
    setBusyAction("asr");
    setStatus({ tone: "busy", message: `Transcribing ${file.name}` });
    try {
      const result = await api.transcribeAudio({
        file,
        providerId: asrProvider?.id ?? "stub-asr",
        language
      });
      if (fillLatest && result.text.trim().length > 0) setLatest(result.text.trim());
      setMediaNotice(`ASR ready · ${result.language} · ${Math.round(result.confidence * 100)}% confidence · ${result.durationMs}ms`);
      setStatus({ tone: "success", message: "Voice note transcribed into Reply Lab" });
    } catch (error) {
      setStatus({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRecordToggle(): Promise<void> {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus({ tone: "error", message: "Browser recording is unavailable; upload a voice note file instead" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type });
        addFiles([file]);
        void transcribeVoiceNote(file);
      };
      recorder.start();
      setIsRecording(true);
      setStatus({ tone: "busy", message: "Recording voice note" });
    } catch (error) {
      setIsRecording(false);
      setStatus({ tone: "error", message: errorMessage(error) });
    }
  }

  async function handleTtsPreview(): Promise<void> {
    const text = latest.trim();
    if (!text) return;
    setBusyAction("tts");
    setStatus({ tone: "busy", message: "Generating voice preview" });
    try {
      const blob = await api.synthesizeSpeech({
        text,
        providerId: ttsProvider?.id ?? "stub-tts",
        language
      });
      downloadBlob("kskill-voice-preview.wav", blob);
      setStatus({ tone: "success", message: "Voice preview download started" });
    } catch (error) {
      setStatus({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>): void {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  async function handleUpload(): Promise<void> {
    if (!canUpload) return;
    setBusyAction("upload");
    setStatus({ tone: "busy", message: "Importing files through /api/imports" });
    try {
      const result = await api.uploadImport({
        packName: packName.trim(),
        type: workflow,
        language,
        consentConfirmed,
        files
      });
      if (!result.packId) throw new Error("Import completed but no pack id was returned");
      setActivePackId(result.packId);
      if (result.pack) setPacks((current) => upsertPack(current, result.pack!));
      setPreview(result.preview ?? { sourceCount: result.sourceCount, duplicateCount: result.duplicateCount, messages: [] });
      setFiles([]);
      await refreshPacks(true);
      setStatus({ tone: "success", message: `Imported ${result.sourceCount} source${result.sourceCount === 1 ? "" : "s"}` });
    } catch (error) {
      setStatus({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePaste(): Promise<void> {
    const text = pasteText.trim();
    if (!canPaste || !text) return;
    setBusyAction("paste");
    setStatus({ tone: "busy", message: "Saving paste into the active pack" });
    try {
      const packId = await ensureActivePack();
      const result = await api.pasteSource(packId, {
        text,
        name: pasteName.trim() || "dm-paste.txt",
        consentConfirmed
      });
      if (result.pack) setPacks((current) => upsertPack(current, result.pack!));
      setPreview(result.preview ?? { sourceCount: result.sourceCount, duplicateCount: result.duplicateCount, messages: [], summary: "Paste saved in the local vault." });
      await refreshPacks(true);
      setStatus({ tone: "success", message: `Paste stored with ${result.sourceCount} parsed source${result.sourceCount === 1 ? "" : "s"}` });
    } catch (error) {
      setStatus({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  }

  async function runPursuitLab(): Promise<void> {
    if (!canRunPursuit) return;
    setBusyAction("pursuit");
    setStatus({ tone: "busy", message: "Running pursuit report and Reply Lab" });
    try {
      const packId = await ensureActivePack();
      const payload = { me, ta, goal, latest, style: replyStyle };
      const result = await api.createPursuitReport(packId, payload);
      setReport(result.report);
      setReportId(result.reportId);
      setTopicPlan(result.topicPlan ?? null);
      let nextReplies = result.replies;

      if (nextReplies.length === 0) {
        try {
          const replyPayload = result.reportId ? { ...payload, reportId: result.reportId } : payload;
          const replyResult = await api.createReplySuggestions(packId, replyPayload);
          nextReplies = replyResult.replies;
          if (replyResult.report) setReport(replyResult.report);
        } catch {
          nextReplies = [];
        }
      }

      setReplies(nextReplies);
      await refreshPacks(true);
      setStatus({
        tone: "success",
        message: nextReplies.length > 0 ? `Report ready with ${nextReplies.length} replies` : "Report ready; no reply suggestions returned"
      });
    } catch (error) {
      setStatus({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleReportDownload(): Promise<void> {
    if (!reportId) return;
    setBusyAction("report-download");
    setStatus({ tone: "busy", message: "Downloading pursuit report" });
    try {
      const blob = await api.downloadReport(reportId);
      downloadBlob(`pursuit_report_${reportId}.md`, blob);
      setStatus({ tone: "success", message: "Report download started" });
    } catch (error) {
      setStatus({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleExportDownload(): Promise<void> {
    if (!activePackId) {
      setStatus({ tone: "error", message: "Select or create a pack before exporting" });
      return;
    }
    setBusyAction("export");
    setStatus({ tone: "busy", message: `Building ${exportTarget} ZIP export` });
    try {
      const created = await api.createExport(activePackId, exportTarget);
      if (!created.exportId) throw new Error("Export completed but no export id was returned");
      const blob = await api.downloadExport(created.exportId);
      downloadBlob(`${safeFilename(currentPackName)}-${exportTarget}.zip`, blob);
      await refreshPacks(true);
      setStatus({ tone: "success", message: "Export ZIP download started" });
    } catch (error) {
      setStatus({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="app-shell">
      <aside className="left-rail">
        <section className="brand-card" aria-label="K.skill">
          <div className="brand-mark">K</div>
          <div className="brand-copy">
            <p>Persona Pack OS</p>
            <h1>K.skill Studio</h1>
          </div>
        </section>

        <section className="story-strip" aria-label="Workflows">
          {workflows.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`story-button ${workflow === item.id ? "active" : ""}`}
              onClick={() => setWorkflow(item.id)}
            >
              <span className="story-ring">{item.icon}</span>
              <strong>{item.title}</strong>
              <small>{item.subline}</small>
            </button>
          ))}
        </section>

        <section className="rail-panel pack-list-panel">
          <div className="section-head">
            <div>
              <p>Vault</p>
              <h2>Pack list</h2>
            </div>
            <button className="icon-button" type="button" onClick={() => void refreshPacks()} aria-label="Refresh packs">
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="pack-list">
            {packs.length > 0 ? packs.map((pack) => (
              <button
                key={pack.id}
                type="button"
                className={`pack-row ${activePackId === pack.id ? "active" : ""}`}
                onClick={() => {
                  setActivePackId(pack.id);
                  setReport(null);
                  setReplies([]);
                  setTopicPlan(null);
                  setStatus({ tone: "neutral", message: `Selected ${pack.name}` });
                }}
              >
                <span className="avatar">{pack.name.slice(0, 1).toUpperCase()}</span>
                <span>
                  <strong>{pack.name}</strong>
                  <small>{pack.type} · {pack.language} · {pack.sourceCount ?? 0} sources</small>
                </span>
                <em>{formatDate(pack.updatedAt ?? pack.createdAt)}</em>
              </button>
            )) : (
              <div className="empty-card compact">
                <Inbox size={18} />
                <span>No packs from /api yet</span>
              </div>
            )}
          </div>
        </section>
      </aside>

      <section className="main-feed">
        <header className="studio-header">
          <div>
            <p className="eyebrow"><AtSign size={14} /> INS / DM workbench</p>
            <h2>{currentPackName}</h2>
          </div>
          <div className={`status-pill ${status.tone}`} role="status">
            {status.tone === "busy" ? <Loader2 className="spin" size={16} /> : status.tone === "error" ? <CircleAlert size={16} /> : <CheckCircle2 size={16} />}
            <span>{status.message}</span>
          </div>
        </header>

        <section className="composer-card">
          <div className="section-head">
            <div>
              <p>Import</p>
              <h2>DM intake</h2>
            </div>
            <ImageUp size={20} />
          </div>

          <div className="intake-tabs" role="tablist" aria-label="Intake modes">
            {[
              { id: "files", label: "Files", icon: <UploadCloud size={15} /> },
              { id: "paste", label: "Paste", icon: <MessageCircle size={15} /> },
              { id: "record", label: "Record", icon: <Mic size={15} /> },
              { id: "media", label: "Media", icon: <Paperclip size={15} /> }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={intakeMode === item.id ? "active" : ""}
                onClick={() => setIntakeMode(item.id as typeof intakeMode)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {intakeMode === "record" && (
            <div className="voice-record-panel">
              <button className={`record-button ${isRecording ? "recording" : ""}`} type="button" onClick={() => void handleRecordToggle()}>
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                {isRecording ? "Stop and transcribe" : "Record voice note"}
              </button>
              <p>{asrProvider ? `${asrProvider.label} · ${asrProvider.mode}` : "Voice provider list loading"}</p>
            </div>
          )}

          {intakeMode === "media" && (
            <div className="media-note">
              <Paperclip size={18} />
              <span>{mediaNotice}</span>
            </div>
          )}

          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              multiple
              accept=".txt,.md,.json,.csv,.html,.htm,.zip,.png,.jpg,.jpeg,.webp,.gif,.pdf,.wav,.mp3,.m4a,.aac,.ogg,.webm,.mp4,.mov,.vtt,.srt"
              onChange={handleFileSelection}
            />
            <UploadCloud size={28} />
            <strong>{files.length > 0 ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : "Drop chat exports"}</strong>
            <span>.txt · .json · .csv · .html · .md · voice · image · sticker · PDF · ZIP</span>
            <button className="secondary-action" type="button" onClick={() => fileInputRef.current?.click()}>
              Choose files
            </button>
          </div>

          {files.length > 0 && (
            <ul className="file-list">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}-${index}`}>
                  <FileText size={16} />
                  <span>{file.name}</span>
                  <small>{formatSize(file.size)}</small>
                  {isVoiceLike(file) && (
                    <button
                      type="button"
                      aria-label={`Transcribe ${file.name}`}
                      onClick={() => void transcribeVoiceNote(file)}
                    >
                      <Mic size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="control-grid">
            <label>
              Pack name
              <input value={packName} onChange={(event) => setPackName(event.target.value)} />
            </label>
            <label>
              Workflow
              <select value={workflow} onChange={(event) => setWorkflow(event.target.value as PersonaType)}>
                {workflows.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label>
              Language
              <select value={language} onChange={(event) => setLanguage(event.target.value as PackLanguage)}>
                {packLanguages.map((item) => <option key={item} value={item}>{languageLabels[item]}</option>)}
              </select>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} />
              <span>Consent confirmed</span>
            </label>
          </div>

          <button className="primary-action" type="button" disabled={!canUpload} onClick={() => void handleUpload()}>
            {busyAction === "upload" ? <Loader2 className="spin" size={17} /> : <UploadCloud size={17} />}
            Upload to API
          </button>

          <div className="paste-panel">
            <div className="section-head mini">
              <div>
                <p>Paste</p>
                <h3>DM text</h3>
              </div>
              <MessageCircle size={18} />
            </div>
            <textarea
              value={pasteText}
              rows={7}
              placeholder="我: 今天那家咖啡店还挺适合看书的&#10;TA: 哈哈哈你终于发现了"
              onChange={(event) => setPasteText(event.target.value)}
            />
            <div className="paste-actions">
              <input value={pasteName} onChange={(event) => setPasteName(event.target.value)} aria-label="Paste source name" />
              <button className="secondary-action" type="button" disabled={!canPaste} onClick={() => void handlePaste()}>
                {busyAction === "paste" ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                Save paste
              </button>
            </div>
          </div>
        </section>

        <div className="feed-grid">
          <section className="surface-card parse-preview">
            <div className="section-head">
              <div>
                <p>Parser</p>
                <h2>Parse preview</h2>
              </div>
              <Layers3 size={20} />
            </div>
            {preview ? (
              <>
                <div className="preview-stats">
                  <span><strong>{preview.sourceCount ?? 0}</strong> sources</span>
                  <span><strong>{preview.duplicateCount ?? 0}</strong> duplicates</span>
                  <span><strong>{preview.messages.length}</strong> messages</span>
                  <span><strong>{preview.assetCount ?? 0}</strong> assets</span>
                  <span><strong>{preview.transcriptCount ?? 0}</strong> transcripts</span>
                  <span><strong>{preview.reactionCount ?? 0}</strong> reactions</span>
                </div>
                {preview.summary && <p className="summary-line">{preview.summary}</p>}
                {(preview.attachmentKinds?.length ?? 0) > 0 && (
                  <div className="media-chip-row">
                    {preview.attachmentKinds?.map((kind) => <span key={kind}>{kind}</span>)}
                  </div>
                )}
                {(preview.diagnostics?.length ?? 0) > 0 && (
                  <div className="diagnostic-list">
                    {preview.diagnostics?.slice(0, 4).map((item) => (
                      <span key={`${item.code}-${item.message}`}>{item.severity}: {item.message}</span>
                    ))}
                  </div>
                )}
                <div className="dm-thread">
                  {preview.messages.length > 0 ? preview.messages.map((message, index) => (
                    <article key={`${message.speaker}-${message.text}-${index}`} className={index % 2 === 0 ? "bubble incoming" : "bubble outgoing"}>
                      <strong>{message.speaker}</strong>
                      <p>{message.text}</p>
                      {message.timestamp && <small>{message.timestamp}</small>}
                    </article>
                  )) : (
                    <div className="empty-card compact">Stored source has no message preview</div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-card">
                <Inbox size={22} />
                <span>Import or paste to see parser output</span>
              </div>
            )}
          </section>

          <section className="surface-card report-card">
            <div className="section-head">
              <div>
                <p>Pursuit</p>
                <h2>Report</h2>
              </div>
              <Archive size={20} />
            </div>

            <div className="pursuit-form">
              <label>Me<input value={me} onChange={(event) => setMe(event.target.value)} /></label>
              <label>TA<input value={ta} onChange={(event) => setTa(event.target.value)} /></label>
              <label>
                Goal
                <select value={goal} onChange={(event) => setGoal(event.target.value as PursuitGoal)}>
                  {goals.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>

            {report ? (
              <div className="report-body">
                <div className={`stage-card ${stageClass(report.stage)}`}>
                  <span>Stage</span>
                  <strong>{report.stage}</strong>
                  <em>{reportConfidence}%</em>
                  <div className="meter"><i style={{ width: `${reportConfidence}%` }} /></div>
                </div>
                <div className="signal-grid">
                  <div><b>{report.warmthSignals.length}</b><span>Warmth</span></div>
                  <div><b>{report.riskSignals.length}</b><span>Risk</span></div>
                  <div><b>{report.strategy.action}</b><span>Action</span></div>
                </div>
                <p className="strategy-copy">{report.strategy.summary || "No strategy summary returned."}</p>
                <p className="next-copy">{report.strategy.nextMove || "No next move returned."}</p>
                <div className="evidence-list">
                  {[...report.warmthSignals, ...report.riskSignals].slice(0, 4).map((item, index) => (
                    <article key={`${item.claim}-${index}`}>
                      <span>{Math.round((item.confidence ?? 0) * 100)}%</span>
                      <p>{item.quote}</p>
                      <small>{item.claim}</small>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-card">
                <Clock3 size={22} />
                <span>Run analysis after a pack has sources</span>
              </div>
            )}
          </section>
        </div>

        <section className="surface-card reply-lab-card">
          <div className="section-head">
            <div>
              <p>Reply Lab</p>
              <h2>Generate sendable replies</h2>
            </div>
            <WandSparkles size={21} />
          </div>
          <div className="reply-controls">
            <label>
              TA latest
              <span className="latest-input-row">
                <input value={latest} onChange={(event) => setLatest(event.target.value)} />
                <button
                  className="icon-button light"
                  type="button"
                  title="Transcribe the first staged voice note"
                  disabled={busyAction !== null || !files.some(isVoiceLike)}
                  onClick={() => {
                    const file = files.find(isVoiceLike);
                    if (file) void transcribeVoiceNote(file);
                  }}
                >
                  <Mic size={16} />
                </button>
                <button
                  className="icon-button light"
                  type="button"
                  title="Create a voice preview"
                  disabled={busyAction !== null || latest.trim().length === 0}
                  onClick={() => void handleTtsPreview()}
                >
                  <Volume2 size={16} />
                </button>
              </span>
            </label>
            <label>
              Style
              <select value={replyStyle} onChange={(event) => setReplyStyle(event.target.value as ReplyStyle)}>
                {replyStyles.map((style) => <option key={style} value={style}>{styleLabels[style]}</option>)}
              </select>
            </label>
            <button className="primary-action" type="button" disabled={!canRunPursuit} onClick={() => void runPursuitLab()}>
              {busyAction === "pursuit" ? <Loader2 className="spin" size={17} /> : <WandSparkles size={17} />}
              Run lab
            </button>
          </div>

          <div className="reply-grid">
            {replies.length > 0 ? replies.map((reply) => (
              <article className="reply-card" key={`${reply.label}-${reply.text}`}>
                <div>
                  <strong>{reply.label}</strong>
                  <span>{reply.boundarySafe ? "Boundary-safe" : "Review needed"}</span>
                </div>
                <p>{reply.text}</p>
                <small>{reply.why || reply.expectedEffect}</small>
                {reply.risk && <em>{reply.risk}</em>}
              </article>
            )) : (
              <div className="empty-card compact">
                <MessageCircleHeart size={19} />
                <span>No replies returned yet</span>
              </div>
            )}
          </div>
        </section>
      </section>

      <aside className="right-dock">
        <section className="surface-card action-card">
          <div className="section-head">
            <div>
              <p>Artifacts</p>
              <h2>Downloads</h2>
            </div>
            <Download size={20} />
          </div>
          <button className="download-row" type="button" disabled={!canDownloadReport} onClick={() => void handleReportDownload()}>
            <Archive size={17} />
            <span>Report markdown</span>
          </button>
          <label>
            Export target
            <select value={exportTarget} onChange={(event) => setExportTarget(event.target.value as ExportTarget)}>
              {exportTargets.map((target) => <option key={target} value={target}>{target}</option>)}
            </select>
          </label>
          <button className="download-row accent" type="button" disabled={!activePackId || busyAction !== null} onClick={() => void handleExportDownload()}>
            {busyAction === "export" ? <Loader2 className="spin" size={17} /> : <FileArchive size={17} />}
            <span>Export ZIP</span>
          </button>
        </section>

        <section className="surface-card topic-card">
          <div className="section-head">
            <div>
              <p>Voice</p>
              <h2>Persona Voice</h2>
            </div>
            <Volume2 size={20} />
          </div>
          <div className="voice-dna">
            <span><b>ASR</b>{asrProvider?.label ?? "stub-asr"}</span>
            <span><b>TTS</b>{ttsProvider?.label ?? "stub-tts"}</span>
            <span><b>DNA</b>pace · pause · catchphrases</span>
            <span><b>Stickers</b>sticker intents travel with exports</span>
          </div>
        </section>

        <section className="surface-card topic-card">
          <div className="section-head">
            <div>
              <p>Plan</p>
              <h2>Topic windows</h2>
            </div>
            <MessageCircle size={20} />
          </div>
          {topicPlan ? (
            <div className="topic-columns">
              <div>
                <b>Low risk</b>
                {topicPlan.lowRiskTopics.slice(0, 5).map((topic) => <span key={topic}>{topic}</span>)}
              </div>
              <div>
                <b>Interest</b>
                {topicPlan.interestBasedTopics.slice(0, 4).map((topic) => <span key={topic}>{topic}</span>)}
              </div>
              <div>
                <b>Avoid</b>
                {topicPlan.avoidTopics.slice(0, 4).map((topic) => <span key={topic}>{topic}</span>)}
              </div>
            </div>
          ) : (
            <div className="empty-card compact">
              <MessageCircle size={18} />
              <span>Run lab for topic plan</span>
            </div>
          )}
        </section>

        <section className="surface-card safety-card">
          <div className="section-head">
            <div>
              <p>Boundaries</p>
              <h2>Safety gate</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          {report ? (
            <>
              <div className={`safety-pill ${report.safety.boundaryDetected ? "blocked" : "clear"}`}>
                {report.safety.boundaryDetected ? "Boundary detected" : "No boundary refusal detected"}
              </div>
              <ul className="safety-list">
                {report.safety.nonManipulation.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </>
          ) : (
            <div className="empty-card compact">
              <ShieldCheck size={18} />
              <span>Awaiting report</span>
            </div>
          )}
        </section>
      </aside>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
