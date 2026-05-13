import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
type ScoreCategoryKey = "openSourceUniqueness" | "industrialProduct" | "excellence" | "endgame";
type ReleaseCategory = {
  label: string;
  score: number;
  passed: boolean;
  earned: unknown[];
};
type ReleaseScoreModule = {
  thresholds: Record<ScoreCategoryKey, number>;
  scoreRepository: (repoRoot: string) => {
    categories: Record<ScoreCategoryKey, ReleaseCategory>;
  };
};

function readPackageJson(): { scripts: Record<string, string> } {
  return JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { scripts: Record<string, string> };
}

function runNpmScript(name: string): string {
  return execFileSync("npm", ["run", name, "--silent"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1" }
  });
}

test.describe.configure({ timeout: 120_000 });

test("package.json exposes the serial release gate contract", () => {
  const scripts = readPackageJson().scripts;
  const requiredScripts = ["verify", "smoke", "test:e2e", "check:readme", "check:exports", "score:release"];

  for (const scriptName of requiredScripts) {
    expect(scripts[scriptName], `${scriptName} script`).toBeTruthy();
  }

  const verify = scripts.verify ?? "";
  const expectedOrder = [
    "npm run lint",
    "npm test",
    "npm run build",
    "npm run check:exports",
    "npm run check:readme",
    "npm run test:e2e",
    "npm run smoke",
    "npm run score:release",
    "node scripts/clean-release-artifacts.mjs",
    "npm pack --dry-run"
  ];

  let cursor = -1;
  for (const command of expectedOrder) {
    const next = verify.indexOf(command);
    expect(next, `${command} is present in verify`).toBeGreaterThan(cursor);
    cursor = next;
  }
  expect(verify).not.toMatch(/(^|[^&])&([^&]|$)/);
  expect(verify).not.toContain("npm-run-all");
});

test("release score is computed from repository artifacts and meets every threshold", async () => {
  const releaseScore = await import(pathToFileURL(resolve(root, "scripts/score-release.mjs")).href) as ReleaseScoreModule;
  const result = releaseScore.scoreRepository(root);

  expect(releaseScore.thresholds).toEqual({
    openSourceUniqueness: 120,
    industrialProduct: 120,
    excellence: 10,
    endgame: 10
  });

  expect(result.categories.openSourceUniqueness?.score).toBeGreaterThanOrEqual(releaseScore.thresholds.openSourceUniqueness);
  expect(result.categories.industrialProduct?.score).toBeGreaterThanOrEqual(releaseScore.thresholds.industrialProduct);
  expect(result.categories.excellence?.score).toBeGreaterThanOrEqual(releaseScore.thresholds.excellence);
  expect(result.categories.endgame?.score).toBeGreaterThanOrEqual(releaseScore.thresholds.endgame);

  for (const category of Object.values(result.categories)) {
    expect(category.passed, category.label).toBe(true);
    expect(category.earned.length, `${category.label} artifact checks`).toBeGreaterThanOrEqual(4);
  }
});

test("offline release helper scripts execute successfully", () => {
  expect(runNpmScript("check:readme")).toContain("README check passed");
  expect(runNpmScript("check:exports")).toContain("Export check passed");
  expect(runNpmScript("smoke")).toContain("Smoke check passed");
  expect(runNpmScript("score:release")).toContain("Release score passed");
});
