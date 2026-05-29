# Data Acquisition Foundation (Phase 0 + Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a `packages/acquisition` layer with a swappable provider registry, ship the robust file-import + manual-paste path end-to-end through the existing importers/media/pack pipeline, and de-risk the WeChat extraction unknowns up front.

**Architecture:** A new single-file package `packages/acquisition` mirrors the `voice` provider-registry pattern: a list of `AcquisitionProvider`s, each declaring where it can run (`runtime`) and what it yields, plus a `selectAcquisitionProviders()` resolver and an `ingest()` orchestrator. Providers are thin adapters over existing code — `file-export` delegates to `media.parseMediaFile`, `manual-paste` delegates to `importers.parseImport`. The Hono server exposes `/api/acquisition/providers` and `/api/acquisition/ingest`. WeChat/voice/OCR providers are deferred to later plans; Phase 0 is a spike that decides the WeChat-on-Mac route.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers in `src`, `.ts` in tests), Node ≥20, Vitest (globals), Hono, Zod. Spec: `docs/superpowers/specs/2026-05-29-data-acquisition-portability-design.md`.

---

## File Structure

- `packages/acquisition/src/index.ts` — **Create.** Types, provider registry, `selectAcquisitionProviders`, `ingest`, and the `file-export` + `manual-paste` providers. One responsibility: orchestrate acquisition into `ParsedSource[]`.
- `tests/acquisition.test.ts` — **Create.** Unit tests for selection, both providers, and `ingest`.
- `package.json` — **Modify.** Add the `./acquisition` export entry.
- `packages/contracts/src/index.ts` — **Modify.** Add `AcquisitionIngestRequestSchema`.
- `packages/server/src/index.ts` — **Modify.** Add `GET /api/acquisition/providers` and `POST /api/acquisition/ingest`.
- `tests/acquisition-api.test.ts` — **Create.** Server-level tests via `createKskillApp().request(...)`.
- `scripts/check-exports.mjs` — **Modify.** Import one acquisition symbol so the export check covers the new package.

> Tasks 2–8 (the package + API) do **not** depend on Task 1 (the spike). Task 1 is listed first per the agreed "de-risk first" ordering and gates the **future** WeChat plan, not this one.

---

## Task 1: Phase 0 — WeChat extraction de-risk spike (investigation, not TDD)

**Goal:** Decide the WeChat-on-Mac route (chatlog vs iPhone-backup) and confirm voice transcoding, then record the outcome in the spec. No production code is written here.

**Files:**
- Modify: `docs/superpowers/specs/2026-05-29-data-acquisition-portability-design.md` (§11 风险 / §12 决策 — record results)

- [ ] **Step 1: Try `chatlog` on this Mac**

Run:
```bash
# chatlog is a Go binary that exposes your own WeChat data over a local API.
go install github.com/sjzar/chatlog@latest 2>/dev/null || echo "no go toolchain — download a release binary from https://github.com/sjzar/chatlog/releases instead"
chatlog --help
```
Expected: either the help text prints (binary works) or a clear "WeChat not found / unsupported on macOS" style error. **Record which.**

- [ ] **Step 2: Attempt a read with WeChat running**

Open the WeChat desktop client and log in, then run `chatlog` (follow its TUI/`server` subcommand per `--help`). Attempt to list/decrypt one conversation.
Decision criteria: **If it returns real messages → mark `chatlog` as the Mac primary. If it errors on key extraction / macOS → fall back to the iPhone-backup route (Step 3).**

- [ ] **Step 3: Try the iPhone-backup route (WechatExporter)**

Make a local (unencrypted) iPhone backup via Finder, then:
```bash
# Download a WechatExporter release: https://github.com/BlueMatthew/WechatExporter/releases
# Point it at the backup directory (~/Library/Application Support/MobileSync/Backup/<id>) and export one chat.
ls "$HOME/Library/Application Support/MobileSync/Backup/"
```
Expected: WechatExporter lists WeChat accounts from the backup and exports a chat (HTML/txt + media). **Record whether it succeeds.**

- [ ] **Step 4: Confirm WeChat voice transcoding (SILK → WAV)**

Take one exported voice file (`.silk`/`.amr` — WeChat audio has a `#!SILK` header) and:
```bash
ffmpeg -version >/dev/null || echo "install ffmpeg: brew install ffmpeg"
# WeChat SILK needs a SILK decoder first (e.g. https://github.com/kn007/silk-v3-decoder),
# producing raw PCM, then ffmpeg wraps it to WAV:
#   ./silk_v3_decoder voice.silk voice.pcm
#   ffmpeg -f s16le -ar 24000 -ac 1 -i voice.pcm voice.wav
```
Expected: a playable `voice.wav`. **Record the working command line.**

- [ ] **Step 5: Record the decision in the spec**

Update §12 D1 with the chosen Mac primary route, and §11 with the confirmed `ffmpeg` command + any version caveats. This is the input to the future Phase 2 (WeChat) plan. No commit (per repo git policy — leave staged for the user).

---

## Task 2: Acquisition types + provider registry skeleton

**Files:**
- Create: `packages/acquisition/src/index.ts`
- Test: `tests/acquisition.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/acquisition.test.ts
import { acquisitionProviders, selectAcquisitionProviders } from "../packages/acquisition/src/index.ts";

describe("acquisition registry", () => {
  test("ships the file-export and manual-paste providers", () => {
    const ids = acquisitionProviders.map((p) => p.info.id);
    expect(ids).toContain("file-export");
    expect(ids).toContain("manual-paste");
    for (const p of acquisitionProviders) {
      expect(p.info.privacyLabel).toBe("local");
      expect(p.info.local).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/acquisition.test.ts`
Expected: FAIL — cannot resolve `../packages/acquisition/src/index.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/acquisition/src/index.ts
import { parseMediaFile, type MediaInputFile } from "../../media/src/index.js";
import { parseImport, type ImportFormat, type ParsedSource } from "../../importers/src/index.js";

export type AcquisitionPlatform =
  | "whatsapp" | "telegram" | "imessage" | "wechat" | "qq" | "line" | "generic" | "manual";
export type AcquisitionMethod =
  | "file-export" | "local-api" | "device-backup" | "manual-paste" | "screenshot-ocr" | "mic-capture";
export type AcquisitionRuntime = "desktop-host" | "browser" | "any";

export type AcquisitionProviderInfo = {
  id: string;
  label: string;
  platform: AcquisitionPlatform;
  method: AcquisitionMethod;
  runtime: AcquisitionRuntime;
  yields: Array<"text" | "voice" | "image" | "video">;
  local: boolean;
  reliability: "robust" | "fragile" | "best-effort";
  external?: { tool: string; swappable: true };
  privacyLabel: "local";
};

export type DeviceProfile = {
  os: "darwin" | "win32" | "linux" | "browser";
  isDesktopHost: boolean;
};

export type AcquisitionDiagnostic = { severity: string; code: string; message: string };

export type AcquisitionInput =
  | { kind: "file"; file: MediaInputFile; platform?: AcquisitionPlatform }
  | { kind: "paste"; name: string; text: string; platform?: AcquisitionPlatform };

export type AcquisitionResult = {
  providerId: string;
  sources: ParsedSource[];
  diagnostics: AcquisitionDiagnostic[];
};

export interface AcquisitionProvider {
  info: AcquisitionProviderInfo;
  isAvailable(profile: DeviceProfile): boolean;
  acquire(input: AcquisitionInput): Promise<AcquisitionResult>;
}

const KNOWN_IMPORT_FORMATS: ReadonlyArray<AcquisitionPlatform> = ["whatsapp", "telegram", "imessage", "wechat", "qq", "line"];

function forcedFormatFor(platform: AcquisitionPlatform | undefined): ImportFormat | undefined {
  return platform && KNOWN_IMPORT_FORMATS.includes(platform) ? (platform as ImportFormat) : undefined;
}

const fileExportProvider: AcquisitionProvider = {
  info: {
    id: "file-export", label: "File export import", platform: "generic", method: "file-export",
    runtime: "any", yields: ["text", "voice", "image", "video"], local: true,
    reliability: "robust", privacyLabel: "local"
  },
  isAvailable: () => true,
  async acquire(input) {
    if (input.kind !== "file") throw new Error("file-export provider requires a file input");
    const result = await parseMediaFile(input.file);
    return {
      providerId: "file-export",
      sources: result.sources,
      diagnostics: result.diagnostics.map((d) => ({ severity: d.severity, code: d.code, message: d.message }))
    };
  }
};

const manualPasteProvider: AcquisitionProvider = {
  info: {
    id: "manual-paste", label: "Manual paste", platform: "manual", method: "manual-paste",
    runtime: "any", yields: ["text"], local: true, reliability: "best-effort", privacyLabel: "local"
  },
  isAvailable: () => true,
  async acquire(input) {
    if (input.kind !== "paste") throw new Error("manual-paste provider requires a paste input");
    const result = parseImport({ name: input.name, text: input.text, forcedFormat: forcedFormatFor(input.platform) });
    const sources = result.import ? [result.import] : [];
    return { providerId: "manual-paste", sources, diagnostics: [] };
  }
};

export const acquisitionProviders: AcquisitionProvider[] = [fileExportProvider, manualPasteProvider];

export function selectAcquisitionProviders(profile: DeviceProfile, platform?: AcquisitionPlatform): AcquisitionProviderInfo[] {
  return acquisitionProviders
    .filter((p) => p.isAvailable(profile))
    .filter((p) => !platform || p.info.platform === platform || p.info.platform === "generic")
    .map((p) => p.info);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/acquisition.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit** (leave for the user to run — repo git policy: do not commit without explicit OK)

```bash
git add packages/acquisition/src/index.ts tests/acquisition.test.ts
git commit -m "feat(acquisition): provider registry skeleton with file-export and manual-paste"
```

---

## Task 3: Provider selection by device profile

**Files:**
- Modify: `packages/acquisition/src/index.ts` (already supports selection; this task pins the behavior with tests and adds the desktop-host filter contract)
- Test: `tests/acquisition.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/acquisition.test.ts
import type { DeviceProfile } from "../packages/acquisition/src/index.ts";

describe("acquisition selection", () => {
  const browser: DeviceProfile = { os: "browser", isDesktopHost: false };
  const mac: DeviceProfile = { os: "darwin", isDesktopHost: true };

  test("file-export and manual-paste are available on any device", () => {
    const onBrowser = selectAcquisitionProviders(browser).map((i) => i.id);
    expect(onBrowser).toEqual(["file-export", "manual-paste"]);
  });

  test("platform filter keeps generic providers but drops mismatches", () => {
    const forWhatsapp = selectAcquisitionProviders(mac, "whatsapp").map((i) => i.id);
    expect(forWhatsapp).toContain("file-export"); // generic, always offered
    expect(forWhatsapp).not.toContain("manual-paste"); // platform "manual" != "whatsapp"
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `npx vitest run tests/acquisition.test.ts`
Expected: PASS (selection logic shipped in Task 2). If FAIL, reconcile the filter in `selectAcquisitionProviders` so generic providers are always retained and platform-specific ones match exactly.

- [ ] **Step 3: Commit**

```bash
git add tests/acquisition.test.ts
git commit -m "test(acquisition): pin provider selection by device profile"
```

---

## Task 4: file-export provider end-to-end (delegates to media)

**Files:**
- Test: `tests/acquisition.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/acquisition.test.ts
import { ingest } from "../packages/acquisition/src/index.ts";

describe("acquisition file-export", () => {
  test("ingests a WhatsApp .txt export into parsed sources", async () => {
    const text = [
      "[2024/01/02, 21:14:03] Alice: 在吗",
      "[2024/01/02, 21:15:10] Bob: 在的，刚下班"
    ].join("\n");
    const bytes = new TextEncoder().encode(text);
    const result = await ingest(
      { kind: "file", file: { name: "WhatsApp Chat - Alice.txt", bytes } },
      { os: "darwin", isDesktopHost: true }
    );
    expect(result.providerId).toBe("file-export");
    expect(result.sources.length).toBeGreaterThan(0);
    const messages = result.sources[0].messages;
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/acquisition.test.ts`
Expected: FAIL — `ingest` is not exported yet.

- [ ] **Step 3: Add the `ingest` orchestrator (minimal, file branch first)**

```ts
// add to packages/acquisition/src/index.ts
export async function ingest(input: AcquisitionInput, profile: DeviceProfile): Promise<AcquisitionResult> {
  const available = acquisitionProviders.filter((p) => p.isAvailable(profile));
  const provider =
    input.kind === "file"
      ? available.find((p) => p.info.method === "file-export")
      : available.find((p) => p.info.method === "manual-paste");
  if (!provider) throw new Error(`No acquisition provider available for input kind "${input.kind}"`);
  return provider.acquire(input);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/acquisition.test.ts`
Expected: PASS. (`parseMediaFile` classifies the `.txt` as text-like and routes through `parseImport`, which detects the WhatsApp line format.)

- [ ] **Step 5: Commit**

```bash
git add packages/acquisition/src/index.ts tests/acquisition.test.ts
git commit -m "feat(acquisition): ingest() routes file uploads through media import"
```

---

## Task 5: manual-paste provider

**Files:**
- Test: `tests/acquisition.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/acquisition.test.ts
describe("acquisition manual-paste", () => {
  test("ingests pasted chat text into parsed sources", async () => {
    const text = "Alice: 周末有空吗\nBob: 有的，去看展？";
    const result = await ingest(
      { kind: "paste", name: "pasted-chat.txt", text },
      { os: "browser", isDesktopHost: false }
    );
    expect(result.providerId).toBe("manual-paste");
    expect(result.sources.length).toBe(1);
    expect(result.sources[0].messages.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run tests/acquisition.test.ts`
Expected: PASS (paste branch already wired in Task 4's `ingest`, manual-paste provider shipped in Task 2). If FAIL, confirm `manualPasteProvider.acquire` pushes `result.import` into `sources`.

- [ ] **Step 3: Commit**

```bash
git add tests/acquisition.test.ts
git commit -m "test(acquisition): cover manual-paste ingestion"
```

---

## Task 6: Wire the package export + verify build

**Files:**
- Modify: `package.json` (add `./acquisition` export)
- Modify: `scripts/check-exports.mjs` (import one acquisition symbol)

- [ ] **Step 1: Add the export entry to `package.json`**

In the `"exports"` object, after the `"./voice"` block, add:
```json
    "./acquisition": {
      "types": "./dist/packages/acquisition/src/index.d.ts",
      "import": "./dist/packages/acquisition/src/index.js"
    },
```

- [ ] **Step 2: Extend the export check**

In `scripts/check-exports.mjs`, inside the generated runner's import block (next to the existing `parseChatText` import), add:
```js
import { selectAcquisitionProviders } from ${JSON.stringify(moduleUrl("packages/acquisition/src/index.ts"))};
```
And after the existing assertions add:
```js
assert(typeof selectAcquisitionProviders === "function", "acquisition export missing selectAcquisitionProviders");
```

- [ ] **Step 3: Run lint/build/exports to verify**

Run: `npm run lint && npx tsc -p tsconfig.build.json && node scripts/check-exports.mjs`
Expected: no type errors; export check prints no assertion failures.

- [ ] **Step 4: Commit**

```bash
git add package.json scripts/check-exports.mjs
git commit -m "build(acquisition): expose ./acquisition entry point and cover it in check-exports"
```

---

## Task 7: Contracts schema for the ingest endpoint

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Test: `tests/acquisition-api.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/acquisition-api.test.ts
import { AcquisitionIngestRequestSchema } from "../packages/contracts/src/index.ts";

describe("AcquisitionIngestRequestSchema", () => {
  test("accepts a paste request and defaults platform to manual", () => {
    const parsed = AcquisitionIngestRequestSchema.parse({ kind: "paste", name: "c.txt", text: "Alice: hi" });
    expect(parsed.platform).toBe("manual");
  });
  test("rejects an unknown kind", () => {
    expect(() => AcquisitionIngestRequestSchema.parse({ kind: "telepathy", text: "x" })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/acquisition-api.test.ts`
Expected: FAIL — `AcquisitionIngestRequestSchema` not exported.

- [ ] **Step 3: Add the schema**

```ts
// add to packages/contracts/src/index.ts (near TtsRequestSchema)
export const AcquisitionIngestRequestSchema = z.object({
  kind: z.enum(["paste"]),
  name: z.string().default("pasted-chat.txt"),
  text: z.string().min(1),
  platform: z
    .enum(["whatsapp", "telegram", "imessage", "wechat", "qq", "line", "generic", "manual"])
    .default("manual")
});
```
> v1 validates the JSON `paste` path only; `file` uploads arrive as multipart form-data and are handled directly in the route (Task 8), like the existing `/api/imports` endpoint.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/acquisition-api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/index.ts tests/acquisition-api.test.ts
git commit -m "feat(contracts): add AcquisitionIngestRequestSchema"
```

---

## Task 8: Server endpoints `/api/acquisition/providers` and `/api/acquisition/ingest`

**Files:**
- Modify: `packages/server/src/index.ts`
- Test: `tests/acquisition-api.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/acquisition-api.test.ts
import { createKskillApp } from "../packages/server/src/index.ts";

describe("acquisition API", () => {
  test("GET /api/acquisition/providers lists local providers", async () => {
    const app = createKskillApp({ staticDir: "dist-web" });
    const res = await app.request("/api/acquisition/providers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.providers.map((p: { id: string }) => p.id)).toContain("manual-paste");
  });

  test("POST /api/acquisition/ingest parses pasted chat", async () => {
    const app = createKskillApp({ staticDir: "dist-web" });
    const res = await app.request("/api/acquisition/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "paste", name: "c.txt", text: "Alice: hi\nBob: yo" })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.sourceCount).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/acquisition-api.test.ts`
Expected: FAIL — routes 404 / `body.ok` undefined.

- [ ] **Step 3: Implement the routes**

Add the import (next to the other package imports at the top of `packages/server/src/index.ts`):
```ts
import { ingest, selectAcquisitionProviders, type DeviceProfile } from "../../acquisition/src/index.js";
import { AcquisitionIngestRequestSchema } from "../../contracts/src/index.js";
```
Inside `createKskillApp`, after the `/api/voice/providers` route, add:
```ts
  app.get("/api/acquisition/providers", (c) => {
    const profile: DeviceProfile = { os: process.platform as DeviceProfile["os"], isDesktopHost: true };
    return c.json(ok({ providers: selectAcquisitionProviders(profile) }));
  });

  app.post("/api/acquisition/ingest", async (c) => {
    let payload;
    try {
      payload = AcquisitionIngestRequestSchema.parse(await c.req.json());
    } catch (error) {
      return c.json(fail("invalid_request", error instanceof Error ? error.message : "bad request"), 400);
    }
    const profile: DeviceProfile = { os: process.platform as DeviceProfile["os"], isDesktopHost: true };
    const result = await ingest({ kind: "paste", name: payload.name, text: payload.text, platform: payload.platform }, profile);
    return c.json(ok({
      providerId: result.providerId,
      sourceCount: result.sources.length,
      diagnostics: result.diagnostics
    }));
  });
```
> `AcquisitionIngestRequestSchema` is already imported on the existing contracts import line if you prefer to extend that line instead of adding a new one.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/acquisition-api.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite + lint**

Run: `npm run lint && npx vitest run`
Expected: all tests PASS (no regressions).

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/index.ts tests/acquisition-api.test.ts
git commit -m "feat(server): add /api/acquisition providers + ingest endpoints"
```

---

## Deferred to follow-up plans (out of scope here)

- **Phase 1b — persistence + intake migration:** the app ALREADY has file-upload + paste intake (`main.tsx` `intakeMode`, via `/api/imports` + `/api/packs/:id/pastes`, which also persist to the vault and dedupe). `/api/acquisition/ingest` currently **parses only** (no persistence). Phase 1b = add vault persistence + file ingest to the acquisition path, then **migrate the existing intake to route through `acquisition`** so WeChat/voice/OCR plug into one path. This is a deliberate refactor — do NOT add a duplicate parallel UI control.
- **Phase 2 — WeChat pipeline:** a `wechat-*` `AcquisitionProvider` (desktop-host, `external.swappable`) built on the **Task 1 spike result** (chatlog local API or iPhone-backup), with SILK→WAV via ffmpeg. Gated on Task 1.
- **Phase 3 — Voice capture for cloning:** PWA mic capture (`MediaRecorder`) + reference-audio handoff to the Spec A voice-clone provider.
- **Phase 4 — OCR fallback:** platform-native (Apple Vision / Android ML Kit) + Tesseract.js.

---

## Self-Review

- **Spec coverage:** §5.1 file imports → Tasks 2/4; §5.3 manual fallback → Tasks 2/5; §5 provider registry/interface → Task 2; §4 device-aware selection → Task 3; §7 server integration → Task 8; §3 acquire→parse→pack flow → Tasks 4/5 (parse stage; pack stage reuses existing `pack-io` via `/api/imports`-style persistence, scheduled with the Phase 1b UI). §5.2 WeChat / §5.4 voice / §11–12 spike → Task 1 + deferred plans. No in-scope requirement left without a task.
- **Placeholder scan:** every code step contains complete, runnable code; commands include expected output. No TBD/TODO.
- **Type consistency:** `AcquisitionProvider`, `AcquisitionInput`, `DeviceProfile`, `AcquisitionResult`, `selectAcquisitionProviders`, `ingest`, `AcquisitionIngestRequestSchema` are defined once (Tasks 2/7) and referenced consistently (Tasks 3–8). `ingest(input, profile)` argument order is identical in every test and the route.
