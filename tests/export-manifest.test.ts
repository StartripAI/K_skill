import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPersonaPack } from "../packages/core/src/index.ts";
import { exportPersonaPack, exportTargets, verifyExportBundle } from "../packages/exporters/src/index.ts";

describe("export manifests and checks", () => {
  test("every exporter writes manifest and passes offline import checks", () => {
    const dir = mkdtempSync(join(tmpdir(), "kskill-manifest-"));
    try {
      const pack = createPersonaPack({ name: "Manifest Demo", type: "advisor", language: "en" });
      for (const target of exportTargets) {
        const result = exportPersonaPack(pack, { target, outDir: join(dir, target) });
        expect(result.files.some((file) => file.endsWith("manifest.json"))).toBe(true);
        const manifestPath = result.files.find((file) => file.endsWith("manifest.json"))!;
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
          target: string;
          fileHashes: Record<string, string>;
          schemaChecks: Array<{ ok: boolean }>;
          instructions: string;
        };
        expect(manifest.target).toBe(target);
        expect(Object.keys(manifest.fileHashes).length).toBeGreaterThan(1);
        expect(manifest.schemaChecks.every((check) => check.ok)).toBe(true);
        expect(manifest.instructions.length).toBeGreaterThan(20);
        expect(verifyExportBundle(result).ok).toBe(true);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("verification catches tampered files and zip export writes a downloadable bundle", () => {
    const dir = mkdtempSync(join(tmpdir(), "kskill-zip-"));
    try {
      const pack = createPersonaPack({ name: "Zip Demo", type: "character", language: "en" });
      const result = exportPersonaPack(pack, { target: "chatgpt", outDir: join(dir, "chatgpt"), zip: true });
      expect(result.zipFile && existsSync(result.zipFile)).toBe(true);
      expect(result.zipFile && readFileSync(result.zipFile).length).toBeGreaterThan(100);
      expect(verifyExportBundle(result).ok).toBe(true);

      const instructions = result.files.find((file) => file.endsWith("instructions.md"))!;
      writeFileSync(instructions, "tampered", "utf8");
      const verification = verifyExportBundle(result);
      expect(verification.ok).toBe(false);
      expect(verification.errors.join("\n")).toMatch(/hash/i);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
