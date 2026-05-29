import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AcquisitionIngestRequestSchema } from "../packages/contracts/src/index.ts";
import { createKskillApp } from "../packages/server/src/index.ts";
import { openVault } from "../packages/vault/src/index.ts";

function tempVault() {
  const dir = mkdtempSync(join(tmpdir(), "kskill-acq-"));
  const vault = openVault(join(dir, "vault.sqlite"));
  return { vault, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe("AcquisitionIngestRequestSchema", () => {
  test("accepts a paste request and defaults platform to manual", () => {
    const parsed = AcquisitionIngestRequestSchema.parse({ kind: "paste", name: "c.txt", text: "Alice: hi" });
    expect(parsed.platform).toBe("manual");
  });

  test("rejects an unknown kind", () => {
    expect(() => AcquisitionIngestRequestSchema.parse({ kind: "telepathy", text: "x" })).toThrow();
  });
});

describe("acquisition API", () => {
  test("GET /api/acquisition/providers lists local providers", async () => {
    const ctx = tempVault();
    try {
      const app = createKskillApp({ vault: ctx.vault, staticDir: "dist-web" });
      const res = await app.request("/api/acquisition/providers");
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: true; data: { providers: Array<{ id: string }> } };
      expect(body.ok).toBe(true);
      expect(body.data.providers.map((provider) => provider.id)).toContain("manual-paste");
    } finally {
      ctx.vault.close();
      ctx.cleanup();
    }
  });

  test("POST /api/acquisition/ingest parses pasted chat", async () => {
    const ctx = tempVault();
    try {
      const app = createKskillApp({ vault: ctx.vault, staticDir: "dist-web" });
      const res = await app.request("/api/acquisition/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "paste", name: "c.txt", text: "Alice: hi\nBob: yo" })
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: true; data: { sourceCount: number; providerId: string } };
      expect(body.ok).toBe(true);
      expect(body.data.providerId).toBe("manual-paste");
      expect(body.data.sourceCount).toBeGreaterThan(0);
    } finally {
      ctx.vault.close();
      ctx.cleanup();
    }
  });

  test("POST /api/acquisition/ingest accepts a multipart file upload", async () => {
    const ctx = tempVault();
    try {
      const app = createKskillApp({ vault: ctx.vault, staticDir: "dist-web" });
      const form = new FormData();
      form.append("files", new File(["Alice: hi\nBob: yo"], "chat.txt", { type: "text/plain" }));
      const res = await app.request("/api/acquisition/ingest", { method: "POST", body: form });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: true; data: { sourceCount: number; providerId: string } };
      expect(body.ok).toBe(true);
      expect(body.data.providerId).toBe("file-export");
      expect(body.data.sourceCount).toBeGreaterThan(0);
    } finally {
      ctx.vault.close();
      ctx.cleanup();
    }
  });

  test("POST /api/acquisition/ingest persists to a pack when packName is given and dedupes", async () => {
    const ctx = tempVault();
    try {
      const app = createKskillApp({ vault: ctx.vault, staticDir: "dist-web" });
      const payload = {
        kind: "paste",
        name: "c.txt",
        text: "Alice: 在吗\nBob: 在的，刚下班",
        packName: "AcqPack",
        consentConfirmed: true
      };
      const init = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) };

      const first = await app.request("/api/acquisition/ingest", init);
      const firstBody = (await first.json()) as { ok: true; data: { packId: string; sourceCount: number } };
      expect(firstBody.ok).toBe(true);
      expect(firstBody.data.sourceCount).toBeGreaterThan(0);
      expect(ctx.vault.listPacks().some((pack) => pack.name === "AcqPack")).toBe(true);

      const second = await app.request("/api/acquisition/ingest", init);
      const secondBody = (await second.json()) as { ok: true; data: { duplicateCount: number } };
      expect(secondBody.data.duplicateCount).toBe(1);
    } finally {
      ctx.vault.close();
      ctx.cleanup();
    }
  });
});
