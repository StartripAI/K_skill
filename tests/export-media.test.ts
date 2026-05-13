import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPersonaPack } from "../packages/core/src/index.ts";
import { exportPersonaPack, exportTargets } from "../packages/exporters/src/index.ts";
import { createMediaAsset } from "../packages/media/src/index.ts";

describe("media-aware exporters", () => {
  test("every export target includes voice and media manifests", () => {
    const bytes = new TextEncoder().encode("avatar reference");
    const asset = createMediaAsset({ name: "avatar.png", bytes, mimeType: "image/png" }, "src_visual", "image");
    const pack = {
      ...createPersonaPack({ name: "Media Export Pack", type: "character", language: "en" }),
      assets: [asset],
      stickerIntents: [{ id: "sticker_gentle", label: "gentle smile", mood: "warm", prompt: "a small gentle smile sticker", whenToUse: "soft reply", evidenceIds: [] }]
    };
    const dir = mkdtempSync(join(tmpdir(), "kskill-media-export-"));

    try {
      for (const target of exportTargets) {
        const result = exportPersonaPack(pack, { target, outDir: join(dir, target), includeAssets: "metadata" });
        expect(result.files.some((file) => file.endsWith("media-manifest.json"))).toBe(true);
        expect(result.files.some((file) => file.endsWith("voice-profile.json"))).toBe(true);
        expect(result.files.some((file) => file.endsWith("sticker-intents.json"))).toBe(true);
        const mediaFile = result.files.find((file) => file.endsWith("media-manifest.json"));
        expect(mediaFile).toBeTruthy();
        const manifest = JSON.parse(readFileSync(mediaFile!, "utf8")) as { includeAssets: string; assets: Array<{ sha256: string }> };
        expect(manifest.includeAssets).toBe("metadata");
        expect(manifest.assets[0]?.sha256).toBe(asset.sha256);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
