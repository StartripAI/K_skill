import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMediaAsset } from "../packages/media/src/index.ts";
import { openVault } from "../packages/vault/src/index.ts";

describe("vault media assets", () => {
  test("persists, dedupes, and reads local asset bytes", () => {
    const dir = mkdtempSync(join(tmpdir(), "kskill-vault-assets-"));
    const vault = openVault(join(dir, "vault.sqlite"));
    try {
      const pack = vault.createPack({ name: "Media Vault", type: "character", language: "en" });
      const bytes = new TextEncoder().encode("fake image bytes");
      const asset = createMediaAsset({ name: "../screens/portrait.png", bytes, mimeType: "image/png" }, "src_media", "image");

      const first = vault.addAssets(pack.id, [{ asset, bytes }]);
      const second = vault.addAssets(pack.id, [{ asset, bytes }]);
      const listed = vault.listAssets(pack.id);
      const readBack = vault.readAssetBytes(first[0]!.asset.id);

      expect(first).toHaveLength(1);
      expect(second).toHaveLength(1);
      expect(listed).toHaveLength(1);
      expect(first[0]!.path).toContain(join("assets", asset.sha256.slice(0, 2)));
      expect(first[0]!.path.includes("..")).toBe(false);
      expect(existsSync(first[0]!.path)).toBe(true);
      expect(new TextDecoder().decode(readBack)).toBe("fake image bytes");
    } finally {
      vault.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
