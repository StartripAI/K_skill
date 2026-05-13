import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createKskillApp } from "../packages/server/src/index.ts";
import { openVault } from "../packages/vault/src/index.ts";

function tempVault() {
  const dir = mkdtempSync(join(tmpdir(), "kskill-vault-"));
  const dbPath = join(dir, "vault.sqlite");
  const vault = openVault(dbPath);
  return { dir, dbPath, vault, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe("local API and SQLite vault", () => {
  test("imports chat files into a persistent pack and skips duplicate source hashes", async () => {
    const ctx = tempVault();
    try {
      const app = createKskillApp({ vault: ctx.vault, staticDir: "dist-web" });
      const form = new FormData();
      form.set("packName", "追TA样例");
      form.set("type", "pursuit");
      form.set("language", "zh");
      form.set("consentConfirmed", "true");
      form.append("files", new File(["我: 今天喝咖啡吗\nTA: 可以呀 你有什么推荐？"], "wechat.txt", { type: "text/plain" }));

      const first = await app.request("/api/imports", { method: "POST", body: form });
      expect(first.status).toBe(200);
      const firstJson = await first.json() as { ok: true; data: { packId: string; sourceCount: number } };
      expect(firstJson.data.sourceCount).toBe(1);

      const second = await app.request("/api/imports", { method: "POST", body: form });
      const secondJson = await second.json() as { ok: true; data: { packId: string; duplicateCount: number; sourceCount: number } };
      expect(secondJson.data.duplicateCount).toBe(1);
      expect(secondJson.data.sourceCount).toBe(1);

      const reopened = openVault(ctx.dbPath);
      expect(reopened.listPacks()[0]?.name).toBe("追TA样例");
      reopened.close();
    } finally {
      ctx.vault.close();
      ctx.cleanup();
    }
  });

  test("persists pursuit reports and export zips with downloadable artifacts", async () => {
    const ctx = tempVault();
    try {
      const app = createKskillApp({ vault: ctx.vault, staticDir: "dist-web" });
      const packResponse = await app.request("/api/packs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Rain", type: "pursuit", language: "zh" })
      });
      const packJson = await packResponse.json() as { ok: true; data: { id: string } };

      await app.request(`/api/packs/${packJson.data.id}/pastes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "我: 周末去看展吗\nTA: 在看！你也喜欢这种吗？", name: "paste.txt", consentConfirmed: true })
      });

      const pursuit = await app.request(`/api/packs/${packJson.data.id}/pursuit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ me: "我", ta: "TA", goal: "ask_out", latest: "你也喜欢这种吗？" })
      });
      const pursuitJson = await pursuit.json() as { ok: true; data: { reportId: string; report: { stage: string } } };
      expect(pursuitJson.data.report.stage).toBe("warm");

      const reportDownload = await app.request(`/api/reports/${pursuitJson.data.reportId}/download`);
      expect(await reportDownload.text()).toContain("pursuit_report");

      const exportResponse = await app.request(`/api/packs/${packJson.data.id}/exports`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target: "sillytavern" })
      });
      const exportJson = await exportResponse.json() as { ok: true; data: { exportId: string } };
      const zip = await app.request(`/api/exports/${exportJson.data.exportId}/download`);
      const bytes = new Uint8Array(await zip.arrayBuffer());
      expect(String.fromCharCode(bytes[0]!, bytes[1]!)).toBe("PK");
    } finally {
      ctx.vault.close();
      ctx.cleanup();
    }
  });
});
