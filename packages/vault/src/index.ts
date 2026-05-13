import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, normalize } from "node:path";
import Database from "better-sqlite3";
import {
  createId,
  createPersonaPack,
  nowIso,
  validatePersonaPack,
  type MediaAsset,
  type PackLanguage,
  type PersonaPack,
  type PersonaType
} from "../../core/src/index.js";
import type { ChatMessage, ParsedSource } from "../../importers/src/index.js";
import type { ParsedAsset } from "../../media/src/index.js";

export type StoredPackSummary = {
  id: string;
  name: string;
  type: PersonaType;
  language: PackLanguage;
  description: string;
  updatedAt: string;
  sourceCount: number;
};

export type StoredSource = {
  id: string;
  packId: string;
  hash: string;
  name: string;
  language: PackLanguage;
  private: boolean;
  consentConfirmed: boolean;
  rawText: string;
  messages: ChatMessage[];
  importedAt: string;
};

export type StoredReport = {
  id: string;
  packId: string;
  kind: string;
  markdown: string;
  report: unknown;
  createdAt: string;
};

export type StoredExport = {
  id: string;
  packId: string;
  target: string;
  zip: Uint8Array;
  manifest: unknown;
  instructions: string;
  createdAt: string;
};

export type StoredAsset = {
  asset: MediaAsset;
  path: string;
};

export type VaultStore = ReturnType<typeof openVault>;

function boolToInt(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}

function intToBool(value: unknown): boolean {
  return Number(value) === 1;
}

export function defaultVaultPath(): string {
  return join(homedir(), "Library", "Application Support", "K.skill", "vault.sqlite");
}

function migrate(db: Database.Database): void {
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      language TEXT NOT NULL,
      description TEXT NOT NULL,
      pack_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_packs_name ON packs(name);

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      hash TEXT NOT NULL,
      name TEXT NOT NULL,
      language TEXT NOT NULL,
      private INTEGER NOT NULL,
      consent_confirmed INTEGER NOT NULL,
      raw_text TEXT NOT NULL,
      messages_json TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      imported_at TEXT NOT NULL,
      UNIQUE(pack_id, hash)
    );
    CREATE INDEX IF NOT EXISTS idx_sources_pack ON sources(pack_id);

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      markdown TEXT NOT NULL,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reports_pack ON reports(pack_id);

    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      target TEXT NOT NULL,
      zip_blob BLOB NOT NULL,
      manifest_json TEXT NOT NULL,
      instructions TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_exports_pack ON exports(pack_id);

    CREATE TABLE IF NOT EXISTS pack_snapshots (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      pack_json TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      pack_id TEXT,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      source_id TEXT NOT NULL,
      message_id TEXT,
      kind TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      byte_length INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(pack_id, sha256)
    );
    CREATE INDEX IF NOT EXISTS idx_assets_pack ON assets(pack_id);
  `);
}

function parsePack(row: { pack_json: string }): PersonaPack {
  const validation = validatePersonaPack(JSON.parse(row.pack_json));
  if (!validation.success) {
    throw new Error(`Invalid pack in vault: ${validation.error.message}`);
  }
  return validation.data;
}

export function openVault(dbPath = defaultVaultPath()) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const assetRoot = join(dirname(dbPath), "assets");
  mkdirSync(assetRoot, { recursive: true });
  const db = new Database(dbPath);
  migrate(db);

  const upsertPackTx = db.transaction((pack: PersonaPack) => {
    db.prepare(`
      INSERT INTO packs (id, name, type, language, description, pack_json, created_at, updated_at)
      VALUES (@id, @name, @type, @language, @description, @packJson, @createdAt, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        language = excluded.language,
        description = excluded.description,
        pack_json = excluded.pack_json,
        updated_at = excluded.updated_at
    `).run({
      id: pack.id,
      name: pack.name,
      type: pack.type,
      language: pack.language,
      description: pack.description,
      packJson: JSON.stringify(pack),
      createdAt: pack.createdAt,
      updatedAt: pack.updatedAt
    });
  });

  const addSourceTx = db.transaction((packId: string, source: ParsedSource) => {
    const existing = db.prepare("SELECT id FROM sources WHERE pack_id = ? AND hash = ?").get(packId, source.source.hash) as { id: string } | undefined;
    if (existing) {
      return { inserted: false, duplicateOf: existing.id, sourceId: existing.id };
    }
    const sourceId = createId("src", `${packId}:${source.source.hash}:${source.source.name}`);
    const storedSource = { ...source.source, id: sourceId };

    db.prepare(`
      INSERT INTO sources (id, pack_id, hash, name, language, private, consent_confirmed, raw_text, messages_json, metadata_json, imported_at)
      VALUES (@id, @packId, @hash, @name, @language, @private, @consentConfirmed, @rawText, @messagesJson, @metadataJson, @importedAt)
    `).run({
      id: sourceId,
      packId,
      hash: storedSource.hash,
      name: storedSource.name,
      language: storedSource.language,
      private: boolToInt(storedSource.private),
      consentConfirmed: boolToInt(storedSource.consentConfirmed),
      rawText: source.text,
      messagesJson: JSON.stringify(source.messages),
      metadataJson: JSON.stringify({ summary: storedSource.summary, type: storedSource.type }),
      importedAt: storedSource.importedAt
    });

    const pack = getPack(packId);
    if (pack) {
      const next: PersonaPack = {
        ...pack,
        updatedAt: nowIso(),
        sources: pack.sources.some((item) => item.hash === storedSource.hash) ? pack.sources : [...pack.sources, storedSource]
      };
      upsertPackTx(next);
    }
    return { inserted: true, sourceId };
  });

  const addAssetsTx = db.transaction((packId: string, assets: ParsedAsset[]) => {
    const stored: StoredAsset[] = [];
    for (const item of assets) {
      const asset = item.asset;
      const assetPath = assetPathFor(asset.storageKey);
      if (item.bytes && !existsSync(assetPath)) {
        mkdirSync(dirname(assetPath), { recursive: true });
        writeFileSync(assetPath, item.bytes);
      }
      const existing = db.prepare("SELECT id FROM assets WHERE pack_id = ? AND sha256 = ?").get(packId, asset.sha256) as { id: string } | undefined;
      if (!existing) {
        db.prepare(`
          INSERT INTO assets (id, pack_id, source_id, message_id, kind, filename, mime_type, byte_length, sha256, storage_key, metadata_json, created_at)
          VALUES (@id, @packId, @sourceId, @messageId, @kind, @filename, @mimeType, @byteLength, @sha256, @storageKey, @metadataJson, @createdAt)
        `).run({
          id: asset.id,
          packId,
          sourceId: asset.sourceId,
          messageId: asset.messageId ?? null,
          kind: asset.kind,
          filename: asset.filename,
          mimeType: asset.mimeType,
          byteLength: asset.byteLength,
          sha256: asset.sha256,
          storageKey: asset.storageKey,
          metadataJson: JSON.stringify(asset.metadata),
          createdAt: asset.createdAt
        });
      }
      stored.push({ asset: existing ? { ...asset, id: existing.id } : asset, path: assetPath });
    }

    const pack = getPack(packId);
    if (pack) {
      const seen = new Set(pack.assets.map((asset) => asset.sha256));
      const nextAssets = [...pack.assets];
      for (const item of stored) {
        if (!seen.has(item.asset.sha256)) nextAssets.push(item.asset);
      }
      upsertPackTx({ ...pack, updatedAt: nowIso(), assets: nextAssets });
    }
    return stored;
  });

  function assetPathFor(storageKey: string): string {
    const normalized = normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, "");
    return join(assetRoot, normalized);
  }

  function createPack(input: { name: string; type: PersonaType; language: PackLanguage; description?: string; idSeed?: string }): PersonaPack {
    const pack = createPersonaPack({
      name: input.name,
      type: input.type,
      language: input.language,
      idSeed: input.idSeed ?? `${input.name}:${Date.now()}:${Math.random()}`,
      ...(input.description ? { description: input.description } : {})
    });
    upsertPackTx(pack);
    return pack;
  }

  function upsertPack(pack: PersonaPack): void {
    upsertPackTx(pack);
  }

  function getPack(id: string): PersonaPack | undefined {
    const row = db.prepare("SELECT pack_json FROM packs WHERE id = ?").get(id) as { pack_json: string } | undefined;
    return row ? parsePack(row) : undefined;
  }

  function findPackByName(name: string): PersonaPack | undefined {
    const row = db.prepare("SELECT pack_json FROM packs WHERE name = ? ORDER BY updated_at DESC LIMIT 1").get(name) as { pack_json: string } | undefined;
    return row ? parsePack(row) : undefined;
  }

  function listPacks(): StoredPackSummary[] {
    const rows = db.prepare(`
      SELECT p.id, p.name, p.type, p.language, p.description, p.updated_at AS updatedAt, COUNT(s.id) AS sourceCount
      FROM packs p
      LEFT JOIN sources s ON s.pack_id = p.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `).all() as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      type: row.type as PersonaType,
      language: row.language as PackLanguage,
      description: String(row.description),
      updatedAt: String(row.updatedAt),
      sourceCount: Number(row.sourceCount)
    }));
  }

  function addSource(packId: string, source: ParsedSource): { inserted: boolean; duplicateOf?: string; sourceId: string } {
    return addSourceTx(packId, source);
  }

  function addAssets(packId: string, assets: ParsedAsset[]): StoredAsset[] {
    return addAssetsTx(packId, assets);
  }

  function listSources(packId: string): StoredSource[] {
    const rows = db.prepare("SELECT * FROM sources WHERE pack_id = ? ORDER BY imported_at ASC").all(packId) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.id),
      packId: String(row.pack_id),
      hash: String(row.hash),
      name: String(row.name),
      language: row.language as PackLanguage,
      private: intToBool(row.private),
      consentConfirmed: intToBool(row.consent_confirmed),
      rawText: String(row.raw_text),
      messages: JSON.parse(String(row.messages_json)) as ChatMessage[],
      importedAt: String(row.imported_at)
    }));
  }

  function getMessages(packId: string): ChatMessage[] {
    return listSources(packId).flatMap((source) => source.messages);
  }

  function listAssets(packId: string): MediaAsset[] {
    const rows = db.prepare("SELECT * FROM assets WHERE pack_id = ? ORDER BY created_at ASC").all(packId) as Array<Record<string, unknown>>;
    return rows.map(rowToAsset);
  }

  function getAsset(id: string): StoredAsset | undefined {
    const row = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    const asset = rowToAsset(row);
    return { asset, path: assetPathFor(asset.storageKey) };
  }

  function readAssetBytes(id: string): Uint8Array | undefined {
    const stored = getAsset(id);
    if (!stored || !existsSync(stored.path)) return undefined;
    return new Uint8Array(readFileSync(stored.path));
  }

  function addReport(packId: string, kind: string, report: unknown, markdown: string): StoredReport {
    const id = createId("report", `${packId}:${kind}:${nowIso()}:${markdown.slice(0, 80)}`);
    const createdAt = nowIso();
    db.prepare("INSERT INTO reports (id, pack_id, kind, markdown, report_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, packId, kind, markdown, JSON.stringify(report), createdAt);
    return { id, packId, kind, markdown, report, createdAt };
  }

  function getReport(id: string): StoredReport | undefined {
    const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return {
      id: String(row.id),
      packId: String(row.pack_id),
      kind: String(row.kind),
      markdown: String(row.markdown),
      report: JSON.parse(String(row.report_json)),
      createdAt: String(row.created_at)
    };
  }

  function listReports(packId: string): StoredReport[] {
    const rows = db.prepare("SELECT * FROM reports WHERE pack_id = ? ORDER BY created_at DESC").all(packId) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.id),
      packId: String(row.pack_id),
      kind: String(row.kind),
      markdown: String(row.markdown),
      report: JSON.parse(String(row.report_json)),
      createdAt: String(row.created_at)
    }));
  }

  function addExport(packId: string, target: string, zip: Uint8Array, manifest: unknown, instructions: string): StoredExport {
    const id = createId("export", `${packId}:${target}:${nowIso()}`);
    const createdAt = nowIso();
    db.prepare("INSERT INTO exports (id, pack_id, target, zip_blob, manifest_json, instructions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, packId, target, Buffer.from(zip), JSON.stringify(manifest), instructions, createdAt);
    return { id, packId, target, zip, manifest, instructions, createdAt };
  }

  function getExport(id: string): StoredExport | undefined {
    const row = db.prepare("SELECT * FROM exports WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return {
      id: String(row.id),
      packId: String(row.pack_id),
      target: String(row.target),
      zip: new Uint8Array(row.zip_blob as Buffer),
      manifest: JSON.parse(String(row.manifest_json)),
      instructions: String(row.instructions),
      createdAt: String(row.created_at)
    };
  }

  function snapshot(packId: string, reason: string): void {
    const pack = getPack(packId);
    if (!pack) return;
    db.prepare("INSERT INTO pack_snapshots (id, pack_id, pack_json, reason, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(createId("snap", `${packId}:${reason}:${nowIso()}`), packId, JSON.stringify(pack), reason, nowIso());
  }

  function patchMemory(packId: string, patch: { corrections?: string[]; preferences?: string[]; relationshipFacts?: Record<string, string> }): PersonaPack | undefined {
    const pack = getPack(packId);
    if (!pack) return undefined;
    snapshot(packId, "memory_patch");
    const next: PersonaPack = {
      ...pack,
      updatedAt: nowIso(),
      memory: {
        ...pack.memory,
        corrections: [...pack.memory.corrections, ...(patch.corrections ?? [])],
        preferences: [...pack.memory.preferences, ...(patch.preferences ?? [])],
        relationshipFacts: { ...pack.memory.relationshipFacts, ...(patch.relationshipFacts ?? {}) }
      }
    };
    upsertPackTx(next);
    return next;
  }

  function close(): void {
    db.close();
  }

  return {
    dbPath,
    close,
    createPack,
    upsertPack,
    getPack,
    findPackByName,
    listPacks,
    addSource,
    addAssets,
    listSources,
    getMessages,
    listAssets,
    getAsset,
    readAssetBytes,
    addReport,
    getReport,
    listReports,
    addExport,
    getExport,
    patchMemory
  };
}

function rowToAsset(row: Record<string, unknown>): MediaAsset {
  const asset: MediaAsset = {
    id: String(row.id),
    kind: row.kind as MediaAsset["kind"],
    sourceId: String(row.source_id),
    filename: String(row.filename),
    mimeType: String(row.mime_type),
    byteLength: Number(row.byte_length),
    sha256: String(row.sha256),
    storageKey: String(row.storage_key),
    metadata: JSON.parse(String(row.metadata_json || "{}")) as Record<string, unknown>,
    createdAt: String(row.created_at)
  };
  if (row.message_id) asset.messageId = String(row.message_id);
  return asset;
}
