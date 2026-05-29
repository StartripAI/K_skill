import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createKskillApp } from "../packages/server/src/index.ts";
import { openVault } from "../packages/vault/src/index.ts";

function tempVault() {
  const dir = mkdtempSync(join(tmpdir(), "kskill-cap-"));
  const vault = openVault(join(dir, "vault.sqlite"));
  return { vault, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe("capability + avatar API", () => {
  test("GET /api/capabilities returns a tier and feature flags", async () => {
    const ctx = tempVault();
    try {
      const app = createKskillApp({ vault: ctx.vault, staticDir: "dist-web" });
      const res = await app.request("/api/capabilities");
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        ok: true;
        data: { tier: string; features: { text: boolean; video: boolean } };
      };
      expect(body.ok).toBe(true);
      expect(["T0", "T1", "T2", "T3"]).toContain(body.data.tier);
      expect(body.data.features.text).toBe(true);
      expect(typeof body.data.features.video).toBe("boolean");
    } finally {
      ctx.vault.close();
      ctx.cleanup();
    }
  });

  test("GET /api/avatar/providers returns an array (gated by tier/accelerator/config)", async () => {
    const ctx = tempVault();
    try {
      const app = createKskillApp({ vault: ctx.vault, staticDir: "dist-web" });
      const res = await app.request("/api/avatar/providers");
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: true; data: { providers: unknown[] } };
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data.providers)).toBe(true);
    } finally {
      ctx.vault.close();
      ctx.cleanup();
    }
  });
});
