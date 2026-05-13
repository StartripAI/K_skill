import { rmSync } from "node:fs";

for (const path of ["test-results", "playwright-report"]) {
  rmSync(new URL(`../${path}`, import.meta.url), { recursive: true, force: true });
}
