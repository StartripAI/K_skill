import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPersonaPack } from "../packages/core/src/index.ts";
import { exportPersonaPack, exportTargets } from "../packages/exporters/src/index.ts";

describe("exporters", () => {
  test("writes real files for every supported platform target", () => {
    const pack = createPersonaPack({
      name: "K Demo",
      type: "advisor",
      language: "en",
      description: "A portable persona pack for testing."
    });
    const dir = mkdtempSync(join(tmpdir(), "kskill-export-"));

    try {
      for (const target of exportTargets) {
        const result = exportPersonaPack(pack, { target, outDir: join(dir, target) });
        expect(result.files.length).toBeGreaterThan(0);
        for (const file of result.files) {
          expect(readFileSync(file, "utf8").length).toBeGreaterThan(20);
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
