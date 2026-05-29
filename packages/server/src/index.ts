import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  AcquisitionIngestRequestSchema,
  CreatePackRequestSchema,
  ExportRequestSchema,
  MemoryPatchRequestSchema,
  PasteSourceRequestSchema,
  PursuitRequestSchema,
  TtsRequestSchema,
  fail,
  ok
} from "../../contracts/src/index.js";
import { ingest, selectAcquisitionProviders, serverDeviceProfile, type AcquisitionResult } from "../../acquisition/src/index.js";
import { detectHardware, serverCapability } from "../../capability/src/index.js";
import { selectAvatarProviders } from "../../avatar/src/index.js";
import { createPersonaPack, inspectPromptStack, renderPersonaMarkdown, type PackLanguage, type PersonaType } from "../../core/src/index.js";
import { distillPersonaPack } from "../../distiller/src/index.js";
import { exportPersonaPackZip } from "../../exporters/src/index.js";
import { classifyMediaFile, parseMediaFile, type MediaInputFile, type ParsedAsset } from "../../media/src/index.js";
import { parseSourceFromText } from "../../pack-io/src/index.js";
import { analyzePursuit, assessSendDecision, generateReplyLab, generateTopicPlan, renderPursuitReport } from "../../pursuit/src/index.js";
import { defaultVaultPath, openVault, type VaultStore } from "../../vault/src/index.js";
import { synthesizeSpeech, transcribeAudio, voicePreviewManifest, voiceProviders } from "../../voice/src/index.js";

export type KskillAppOptions = {
  vault?: VaultStore;
  vaultPath?: string;
  staticDir?: string;
};

type ImportResponse = {
  packId: string;
  sourceCount: number;
  duplicateCount: number;
  previews: Array<{
    name: string;
    messageCount: number;
    speakers: string[];
    language: PackLanguage;
    duplicate: boolean;
    messages: Array<{ speaker: string; text: string; timestamp?: string }>;
    assetCount?: number;
    transcriptCount?: number;
    reactionCount?: number;
    attachmentKinds?: string[];
    diagnostics?: Array<{ code: string; message: string; severity: string }>;
  }>;
  preview?: {
    sourceCount: number;
    duplicateCount: number;
    sourceName?: string;
    summary?: string;
    messages: Array<{ speaker: string; text: string; timestamp?: string }>;
    assetCount?: number;
    transcriptCount?: number;
    reactionCount?: number;
    attachmentKinds?: string[];
    diagnostics?: Array<{ code: string; message: string; severity: string }>;
  };
};

function contentTypeFor(path: string): string {
  const extension = extname(path);
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".gif") return "image/gif";
  if (extension === ".webp") return "image/webp";
  if (extension === ".wav") return "audio/wav";
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".m4a") return "audio/mp4";
  if (extension === ".json") return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function normalizeFiles(value: unknown): File[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item): item is File => item instanceof File);
  return value instanceof File ? [value] : [];
}

async function readJson<T>(request: Request, schema: { parse: (value: unknown) => T }): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

function serializeReport(report: ReturnType<typeof analyzePursuit>) {
  return {
    id: report.id,
    stage: report.stage,
    relationshipStage: report.relationshipStage,
    confidence: report.confidence,
    trend: report.trend,
    dateReadiness: report.dateReadiness,
    sendDecision: report.sendDecision,
    boundary: report.boundary,
    safety: report.safety,
    strategy: report.strategy,
    warmthSignals: report.warmthSignals,
    riskSignals: report.riskSignals,
    latestTurns: report.latestTurns
  };
}

function sourcePreview(name: string, source: ReturnType<typeof parseSourceFromText>, duplicate: boolean, extras: Partial<ImportResponse["previews"][number]> = {}): ImportResponse["previews"][number] {
  const speakers = [...new Set(source.messages.map((message) => message.speaker))].slice(0, 12);
  return {
    name,
    messageCount: source.messages.length,
    speakers,
    language: source.source.language,
    duplicate,
    messages: source.messages.slice(0, 8).map((message) => ({
      speaker: message.speaker,
      text: message.text,
      ...(message.timestamp ? { timestamp: message.timestamp } : {})
    })),
    ...extras
  };
}

async function toMediaInput(file: File): Promise<MediaInputFile> {
  return {
    name: file.name,
    bytes: new Uint8Array(await file.arrayBuffer()),
    ...(file.type ? { mimeType: file.type } : {})
  };
}

function remapAssets(assets: ParsedAsset[], sourceId: string): ParsedAsset[] {
  return assets.map((item) => ({ ...item, asset: { ...item.asset, sourceId } }));
}

function persistAcquiredSources(
  vault: VaultStore,
  options: { packName: string; type: PersonaType; language: PackLanguage; consentConfirmed: boolean },
  results: AcquisitionResult[]
): { packId: string; sourceCount: number; duplicateCount: number } {
  const pack =
    vault.findPackByName(options.packName) ??
    vault.createPack({ name: options.packName, type: options.type, language: options.language });
  let duplicateCount = 0;
  for (const result of results) {
    for (const source of result.sources) {
      const stored = vault.addSource(pack.id, {
        ...source,
        source: { ...source.source, consentConfirmed: options.consentConfirmed, private: true }
      });
      duplicateCount += stored.inserted ? 0 : 1;
      const sourceAssets = remapAssets(
        result.assets.filter((asset) => asset.asset.sourceId === source.source.id || result.sources.length === 1),
        stored.sourceId
      );
      if (sourceAssets.length) vault.addAssets(pack.id, sourceAssets);
      if (stored.inserted) {
        const current = vault.getPack(pack.id) ?? pack;
        vault.upsertPack(distillPersonaPack(current, { ...source, source: { ...source.source, id: stored.sourceId } }));
      }
    }
  }
  return { packId: pack.id, sourceCount: vault.listSources(pack.id).length, duplicateCount };
}

export function createKskillApp(options: KskillAppOptions = {}) {
  const vault = options.vault ?? openVault(options.vaultPath ?? defaultVaultPath());
  const staticDir = options.staticDir ?? "dist-web";
  const app = new Hono();

  app.onError((error, c) => {
    const status = error instanceof SyntaxError ? 400 : 500;
    return c.json(fail("request_failed", error.message), status);
  });

  app.get("/api/health", (c) => c.json(ok({ status: "ok", service: "kskill", vault: vault.dbPath })));
  app.get("/api/vault", (c) => c.json(ok({ path: vault.dbPath, packs: vault.listPacks().length })));
  app.get("/api/packs", (c) => c.json(ok({ packs: vault.listPacks() })));
  app.get("/api/voice/providers", (c) => c.json(ok({
    providers: voiceProviders.map((provider) => ({
      ...provider,
      kind: provider.capabilities.some((capability) => capability.startsWith("asr")) ? "asr" : "tts",
      mode: provider.id.startsWith("stub") ? "stub" : provider.runtime === "browser" ? "browser" : provider.local ? "local" : "remote",
      languages: ["zh", "en", "ja", "ko", "es"],
      configured: provider.id === "local-command-tts" || provider.id === "local-voice-clone"
        ? Boolean(process.env.KSKILL_LOCAL_TTS_COMMAND ?? process.env.KS_LOCAL_TTS_COMMAND)
        : !provider.requiresSecret
    }))
  })));

  app.get("/api/acquisition/providers", (c) =>
    c.json(ok({ providers: selectAcquisitionProviders(serverDeviceProfile()) })));

  app.get("/api/capabilities", (c) => c.json(ok(serverCapability())));

  app.get("/api/avatar/providers", (c) =>
    c.json(ok({ providers: selectAvatarProviders(detectHardware()) })));

  app.post("/api/acquisition/ingest", async (c) => {
    const contentType = c.req.header("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody({ all: true });
      const files = normalizeFiles(body.files);
      const results: AcquisitionResult[] = [];
      for (const file of files) {
        results.push(await ingest({ kind: "file", file: await toMediaInput(file) }, serverDeviceProfile()));
      }
      const packName = typeof body.packName === "string" ? body.packName : "";
      if (packName) {
        const persisted = persistAcquiredSources(
          vault,
          {
            packName,
            type: String(body.type ?? "pursuit") as PersonaType,
            language: String(body.language ?? "zh") as PackLanguage,
            consentConfirmed: String(body.consentConfirmed ?? "false") === "true"
          },
          results
        );
        return c.json(ok({ providerId: "file-export", ...persisted }));
      }
      return c.json(
        ok({
          providerId: "file-export",
          sourceCount: results.reduce((sum, result) => sum + result.sources.length, 0),
          diagnostics: results.flatMap((result) => result.diagnostics)
        })
      );
    }
    let payload: ReturnType<typeof AcquisitionIngestRequestSchema.parse>;
    try {
      payload = AcquisitionIngestRequestSchema.parse(await c.req.json());
    } catch (error) {
      return c.json(fail("invalid_request", error instanceof Error ? error.message : "bad request"), 400);
    }
    const result = await ingest(
      { kind: "paste", name: payload.name, text: payload.text, platform: payload.platform },
      serverDeviceProfile()
    );
    if (payload.packName) {
      const persisted = persistAcquiredSources(
        vault,
        {
          packName: payload.packName,
          type: payload.type,
          language: payload.language,
          consentConfirmed: payload.consentConfirmed
        },
        [result]
      );
      return c.json(ok({ providerId: result.providerId, ...persisted }));
    }
    return c.json(ok({ providerId: result.providerId, sourceCount: result.sources.length, diagnostics: result.diagnostics }));
  });

  app.post("/api/packs", async (c) => {
    const input = await readJson(c.req.raw, CreatePackRequestSchema);
    const pack = vault.createPack({
      name: input.name,
      type: input.type,
      language: input.language,
      ...(input.description ? { description: input.description } : {})
    });
    return c.json(ok({ id: pack.id, pack }));
  });

  app.get("/api/packs/:id", (c) => {
    const pack = vault.getPack(c.req.param("id"));
    if (!pack) return c.json(fail("not_found", "Pack not found"), 404);
    return c.json(ok({ pack }));
  });

  app.post("/api/imports", async (c) => {
    const body = await c.req.parseBody({ all: true });
    const packName = String(body.packName ?? "K.skill Pack");
    const type = String(body.type ?? "pursuit") as PersonaType;
    const language = String(body.language ?? "zh") as PackLanguage;
    const consentConfirmed = String(body.consentConfirmed ?? "false") === "true";
    const files = normalizeFiles(body.files);
    const pack = vault.findPackByName(packName) ?? vault.createPack({ name: packName, type, language });
    let duplicateCount = 0;
    const previews: ImportResponse["previews"] = [];

    for (const file of files) {
      const mediaInput = await toMediaInput(file);
      const classified = classifyMediaFile(mediaInput);
      const parsed = classified.textLike
        ? { sources: [parseSourceFromText(await file.text(), file.name, { consentConfirmed, private: true })], assets: [], diagnostics: [], asrResults: [] }
        : await parseMediaFile(mediaInput, { consentConfirmed, private: true, asr: { providerId: "stub-asr", language } });

      for (const source of parsed.sources) {
        const result = vault.addSource(pack.id, { ...source, source: { ...source.source, consentConfirmed, private: true } });
        duplicateCount += result.inserted ? 0 : 1;
        const sourceAssets = remapAssets(parsed.assets.filter((asset) => asset.asset.sourceId === source.source.id || parsed.sources.length === 1), result.sourceId);
        if (sourceAssets.length) vault.addAssets(pack.id, sourceAssets);
        previews.push(sourcePreview(file.name, source, !result.inserted, {
          assetCount: sourceAssets.length,
          transcriptCount: source.messages.reduce((sum, message) => sum + (message.transcripts?.length ?? 0), 0),
          reactionCount: source.messages.reduce((sum, message) => sum + (message.reactions?.length ?? 0), 0),
          attachmentKinds: [...new Set(source.messages.flatMap((message) => message.attachments?.map((attachment) => attachment.kind) ?? []))],
          diagnostics: parsed.diagnostics
        }));
        if (result.inserted) {
          const current = vault.getPack(pack.id) ?? pack;
          vault.upsertPack(distillPersonaPack(current, { ...source, source: { ...source.source, id: result.sourceId } }));
        }
      }
    }

    const sourceCount = vault.listSources(pack.id).length;
    return c.json(ok<ImportResponse>({
      packId: pack.id,
      sourceCount,
      duplicateCount,
      previews,
      preview: {
        sourceCount,
        duplicateCount,
        summary: previews.map((item) => `${item.name}: ${item.messageCount} messages`).join("; "),
        messages: previews.flatMap((item) => item.messages).slice(0, 8),
        assetCount: previews.reduce((sum, item) => sum + (item.assetCount ?? 0), 0),
        transcriptCount: previews.reduce((sum, item) => sum + (item.transcriptCount ?? 0), 0),
        reactionCount: previews.reduce((sum, item) => sum + (item.reactionCount ?? 0), 0),
        attachmentKinds: [...new Set(previews.flatMap((item) => item.attachmentKinds ?? []))],
        diagnostics: previews.flatMap((item) => item.diagnostics ?? []),
        ...(previews[0]?.name ? { sourceName: previews[0].name } : {})
      }
    }));
  });

  app.post("/api/voice/asr", async (c) => {
    const body = await c.req.parseBody({ all: true });
    const file = normalizeFiles(body.file ?? body.files)[0];
    if (!file) return c.json(fail("missing_audio", "Audio file is required"), 400);
    const media = await toMediaInput(file);
    const result = await transcribeAudio({ bytes: media.bytes, filename: media.name, mimeType: media.mimeType ?? "application/octet-stream" }, {
      providerId: String(body.providerId ?? "stub-asr") as never,
      language: String(body.language ?? "zh")
    });
    return c.json(ok({ result }));
  });

  app.post("/api/voice/tts", async (c) => {
    const input = await readJson(c.req.raw, TtsRequestSchema);
    const audio = await synthesizeSpeech(input.text, {
      providerId: input.providerId as never,
      ...(input.voice ? { voice: input.voice } : {}),
      ...(input.language ? { language: input.language } : {}),
      ...(input.referenceAudioPath ? { referenceAudioPath: input.referenceAudioPath } : {}),
      ...(input.voiceProfilePath ? { voiceProfilePath: input.voiceProfilePath } : {}),
      ...(input.timeoutMs ? { timeoutMs: input.timeoutMs } : {}),
      format: input.format
    });
    c.header("x-kskill-tts-manifest", JSON.stringify(voicePreviewManifest(audio, input.language ?? "auto")));
    return new Response(Buffer.from(audio.bytes), {
      headers: {
        "content-type": audio.mimeType,
        "x-kskill-voice-id": audio.voiceId,
        "x-kskill-sha256": audio.sha256
      }
    });
  });

  app.post("/api/packs/:id/pastes", async (c) => {
    const packId = c.req.param("id");
    const pack = vault.getPack(packId);
    if (!pack) return c.json(fail("not_found", "Pack not found"), 404);
    const input = await readJson(c.req.raw, PasteSourceRequestSchema);
    const source = parseSourceFromText(input.text, input.name, input);
    const result = vault.addSource(packId, source);
    if (result.inserted) {
      vault.upsertPack(distillPersonaPack(vault.getPack(packId) ?? pack, { ...source, source: { ...source.source, id: result.sourceId } }));
    }
    const preview = sourcePreview(input.name, source, !result.inserted);
    return c.json(ok({
      sourceId: result.sourceId,
      duplicate: !result.inserted,
      sourceCount: vault.listSources(packId).length,
      duplicateCount: result.inserted ? 0 : 1,
      preview: {
        sourceCount: vault.listSources(packId).length,
        duplicateCount: result.inserted ? 0 : 1,
        sourceName: input.name,
        summary: source.source.summary,
        messages: preview.messages
      }
    }));
  });

  app.get("/api/packs/:id/sources", (c) => {
    const packId = c.req.param("id");
    return c.json(ok({ sources: vault.listSources(packId).map((source) => ({ ...source, rawText: source.rawText.slice(0, 2000) })) }));
  });

  app.get("/api/packs/:id/prompt-stack", (c) => {
    const pack = vault.getPack(c.req.param("id"));
    if (!pack) return c.json(fail("not_found", "Pack not found"), 404);
    return c.json(ok({ stack: inspectPromptStack(pack), persona: renderPersonaMarkdown(pack) }));
  });

  app.post("/api/packs/:id/pursuit", async (c) => {
    const packId = c.req.param("id");
    const pack = vault.getPack(packId);
    if (!pack) return c.json(fail("not_found", "Pack not found"), 404);
    const input = await readJson(c.req.raw, PursuitRequestSchema);
    const report = analyzePursuit(vault.getMessages(packId), {
      userName: input.me,
      targetName: input.ta,
      goal: input.goal,
      language: pack.language,
      latestMessage: input.latest,
      draftMessage: input.draft,
      maxTurns: input.maxTurns
    });
    const replies = generateReplyLab(report, input.latest, input.style);
    const topicPlan = generateTopicPlan(report);
    const sendDecision = assessSendDecision(report, input.draft ?? input.latest ?? "");
    const markdown = renderPursuitReport(report);
    const stored = vault.addReport(packId, "pursuit_report", { report, replies, topicPlan, sendDecision }, markdown);
    return c.json(ok({
      reportId: stored.id,
      report: { ...serializeReport(report), stage: report.stage === "stranger" && report.relationshipStage.id === "date_window" ? "warm" : report.stage },
      replies,
      topicPlan,
      sendDecision
    }));
  });

  app.post("/api/packs/:id/replies", async (c) => {
    const packId = c.req.param("id");
    const pack = vault.getPack(packId);
    if (!pack) return c.json(fail("not_found", "Pack not found"), 404);
    const input = await readJson(c.req.raw, PursuitRequestSchema);
    const report = analyzePursuit(vault.getMessages(packId), {
      userName: input.me,
      targetName: input.ta,
      goal: input.goal,
      language: pack.language,
      latestMessage: input.latest,
      draftMessage: input.draft,
      maxTurns: input.maxTurns
    });
    const replies = generateReplyLab(report, input.latest, input.style);
    return c.json(ok({ report: serializeReport(report), replies }));
  });

  app.get("/api/packs/:id/reports", (c) => c.json(ok({ reports: vault.listReports(c.req.param("id")) })));

  app.get("/api/reports/:reportId/download", (c) => {
    const report = vault.getReport(c.req.param("reportId"));
    if (!report) return c.json(fail("not_found", "Report not found"), 404);
    c.header("content-type", "text/markdown; charset=utf-8");
    c.header("content-disposition", `attachment; filename="${report.kind}.md"`);
    return c.body(report.markdown);
  });

  app.post("/api/packs/:id/exports", async (c) => {
    const packId = c.req.param("id");
    const pack = vault.getPack(packId);
    if (!pack) return c.json(fail("not_found", "Pack not found"), 404);
    const input = await readJson(c.req.raw, ExportRequestSchema);
    const bundle = exportPersonaPackZip(pack, { target: input.target, includeAssets: input.includeAssets });
    const stored = vault.addExport(packId, input.target, bundle.zip, bundle.manifest, bundle.instructions);
    return c.json(ok({ exportId: stored.id, target: input.target, manifest: bundle.manifest, instructions: bundle.instructions }));
  });

  app.get("/api/packs/:id/assets", (c) => c.json(ok({ assets: vault.listAssets(c.req.param("id")) })));

  app.get("/api/packs/:id/assets/:assetId/download", (c) => {
    const stored = vault.getAsset(c.req.param("assetId"));
    if (!stored) return c.json(fail("not_found", "Asset not found"), 404);
    const bytes = vault.readAssetBytes(stored.asset.id);
    if (!bytes) return c.json(fail("not_found", "Asset bytes not found"), 404);
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": stored.asset.mimeType,
        "content-disposition": `attachment; filename="${stored.asset.filename}"`
      }
    });
  });

  app.get("/api/exports/:exportId/download", (c) => {
    const artifact = vault.getExport(c.req.param("exportId"));
    if (!artifact) return c.json(fail("not_found", "Export not found"), 404);
    return new Response(Buffer.from(artifact.zip), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${artifact.target}.zip"`
      }
    });
  });

  app.get("/api/packs/:id/memory", (c) => {
    const pack = vault.getPack(c.req.param("id"));
    if (!pack) return c.json(fail("not_found", "Pack not found"), 404);
    return c.json(ok({ memory: pack.memory }));
  });

  app.patch("/api/packs/:id/memory", async (c) => {
    const input = await readJson(c.req.raw, MemoryPatchRequestSchema);
    const patch = {
      ...(input.corrections ? { corrections: input.corrections } : {}),
      ...(input.preferences ? { preferences: input.preferences } : {}),
      ...(input.relationshipFacts ? { relationshipFacts: input.relationshipFacts } : {})
    };
    const pack = vault.patchMemory(c.req.param("id"), patch);
    if (!pack) return c.json(fail("not_found", "Pack not found"), 404);
    return c.json(ok({ memory: pack.memory }));
  });

  app.get("*", (c) => {
    const requested = c.req.path === "/" ? "index.html" : c.req.path.replace(/^\/+/, "");
    const filePath = join(staticDir, requested);
    const path = existsSync(filePath) ? filePath : join(staticDir, "index.html");
    if (!existsSync(path)) {
      return c.text("K.skill Web GUI has not been built yet. Run npm run build.", 404);
    }
    c.header("content-type", contentTypeFor(path));
    return c.body(readFileSync(path));
  });

  return app;
}

export function startKskillServer(options: KskillAppOptions & { port?: number; hostname?: string } = {}) {
  const app = createKskillApp(options);
  const port = options.port ?? 5999;
  const hostname = options.hostname ?? "127.0.0.1";
  const server = serve({ fetch: app.fetch, port, hostname });
  return { app, server, url: `http://${hostname}:${port}` };
}
