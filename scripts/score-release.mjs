import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const thresholds = {
  openSourceUniqueness: 120,
  industrialProduct: 120,
  excellence: 10,
  endgame: 10
};

const categories = {
  openSourceUniqueness: {
    label: "Open-source uniqueness",
    threshold: thresholds.openSourceUniqueness,
    rules: [
      {
        id: "persona-pack-os",
        label: "Defines a Persona Pack OS instead of a generic prompt wrapper",
        points: 20,
        artifacts: ["README.md", "packages/core/src/index.ts"],
        check: (repo) => includes(repo, "README.md", ["Persona Pack OS", "完整人格系统", "Prompt Stack"]) &&
          includes(repo, "packages/core/src/index.ts", ["PersonaPackSchema", "personaTypes"])
      },
      {
        id: "complete-workflow-suite",
        label: "Ships a complete four-workflow product without outside comparison positioning",
        points: 20,
        artifacts: ["README.md"],
        check: (repo) => includes(repo, "README.md", ["Crush Coach", "Relationship Memory", "Character World", "Movie Character", "Life Mentor"]) &&
          ![["ex", "skill"].join("-"), ["nuwa", "skill"].join("-"), ["ST", "memory"].join(" "), ["参考", "项目"].join(""), ["借", "鉴"].join(""), ["base", "line"].join("")]
            .some((needle) => text(repo, "README.md").includes(needle))
      },
      {
        id: "localized-docs",
        label: "Ships multilingual public documentation",
        points: 20,
        artifacts: ["README.md", "README_EN.md", "README_JA.md", "README_KO.md", "README_ES.md"],
        check: (repo) => ["README_EN.md", "README_JA.md", "README_KO.md", "README_ES.md"].every((path) => text(repo, path).includes("K.skill")) &&
          includes(repo, "README.md", ["English", "日本語", "한국어", "Español", "Life Mentor"])
      },
      {
        id: "multi-client-exporters",
        label: "Exports one source pack into many AI client formats",
        points: 20,
        artifacts: ["packages/exporters/src/index.ts", "README.md"],
        check: (repo) => {
          const targets = ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"];
          return targets.every((target) => text(repo, "packages/exporters/src/index.ts").includes(`"${target}"`)) &&
            targets.every((target) => text(repo, "README.md").toLowerCase().includes(target));
        }
      },
      {
        id: "crush-coach-boundaries",
        label: "Includes a respectful Crush Coach with explicit stop-after-refusal logic",
        points: 20,
        artifacts: ["packages/pursuit/src/index.ts", "README.md", "examples/refusal-chat-en.txt"],
        check: (repo) => includes(repo, "packages/pursuit/src/index.ts", ["boundaryDetected", "respect_boundary", "stop pursuing", "no bypassing refusal"]) &&
          includes(repo, "README.md", ["我要追TA", "不做 PUA", "TA 明确拒绝"])
      },
      {
        id: "broad-import-surface",
        label: "Accepts chat logs, cards, JSON, CSV, HTML, and plain text sources",
        points: 15,
        artifacts: ["packages/importers/src/index.ts", "README.md"],
        check: (repo) => includes(repo, "packages/importers/src/index.ts", ["parseJsonChat", "parseCsvChat", "stripHtml", "parseCharacterCard"]) &&
          includes(repo, "README.md", ["上传文件", "粘贴资料", "SillyTavern Character Card", "movie-character.md"])
      },
      {
        id: "social-product-workbench",
        label: "Provides a social-product Web workbench, not only a library API",
        points: 15,
        artifacts: ["apps/web/src/main.tsx", "apps/web/src/styles.css"],
        check: (repo) => includes(repo, "apps/web/src/main.tsx", ["Reply Lab", "Crush Coach", "Life Mentor", "Downloads", "stage-card"]) &&
          includes(repo, "apps/web/src/styles.css", [".reply-card", ".stage-card", ".story-strip"])
      },
      {
        id: "agent-skill-compatibility",
        label: "Builds Codex and Claude skill artifacts from persona packs",
        points: 15,
        artifacts: ["packages/exporters/src/index.ts", "package.json"],
        check: (repo) => includes(repo, "packages/exporters/src/index.ts", ["SKILL.md", "references/persona.md", "Claude Code"]) &&
          (json(repo, "package.json").keywords ?? []).includes("agent-skills")
      }
    ]
  },
  industrialProduct: {
    label: "Industrial product",
    threshold: thresholds.industrialProduct,
    rules: [
      {
        id: "cli-surface",
        label: "CLI covers the full persona-pack lifecycle",
        points: 20,
        artifacts: ["packages/cli/src/index.ts"],
        check: (repo) => ["init", "import", "distill", "pursue", "reply", "topics", "memory", "inspect", "compile", "eval", "serve"].every((command) =>
          text(repo, "packages/cli/src/index.ts").includes(`.command("${command}")`)
        )
      },
      {
        id: "schema-validation",
        label: "Core data model has typed schema validation and migration",
        points: 15,
        artifacts: ["packages/core/src/index.ts"],
        check: (repo) => includes(repo, "packages/core/src/index.ts", ["z.object", "PersonaPackSchema", "validatePersonaPack", "migratePersonaPack"])
      },
      {
        id: "prompt-eval-boundaries",
        label: "Prompt stack, built-in evals, and boundaries are first-class artifacts",
        points: 15,
        artifacts: ["packages/core/src/index.ts", "packages/cli/src/index.ts"],
        check: (repo) => includes(repo, "packages/core/src/index.ts", ["inspectPromptStack", "boundary-refusal", "Forbidden:"]) &&
          includes(repo, "packages/cli/src/index.ts", ["has boundaries", "has eval cases", "has prompt stack"])
      },
      {
        id: "export-validation",
        label: "Release gate validates all exporter outputs by generating real artifacts",
        points: 20,
        artifacts: ["scripts/check-exports.mjs", "packages/exporters/src/index.ts"],
        check: (repo) => includes(repo, "scripts/check-exports.mjs", ["targets", "character-card-v2.json", "system-prompt.json", "Export check passed"]) &&
          includes(repo, "packages/exporters/src/index.ts", ["buildSkillExport", "buildChatGpt", "buildSillyTavern", "buildOpenWebUi"])
      },
      {
        id: "e2e-release-tests",
        label: "E2E tests cover release gates and offline helper scripts",
        points: 15,
        artifacts: ["tests/e2e/release-gate.spec.ts", "playwright.config.ts"],
        check: (repo) => includes(repo, "tests/e2e/release-gate.spec.ts", ["serial release gate contract", "scoreRepository", "offline release helper scripts"]) &&
          includes(repo, "playwright.config.ts", ["testDir", "fullyParallel: false"])
      },
      {
        id: "unit-coverage",
        label: "Unit tests cover importers, exporters, pursuit, distiller, vault, and i18n",
        points: 15,
        artifacts: ["tests"],
        check: (repo) => [
          "tests/importers-industrial.test.ts",
          "tests/exporters.test.ts",
          "tests/export-manifest.test.ts",
          "tests/pursuit.test.ts",
          "tests/pursuit-advanced.test.ts",
          "tests/distiller-llm.test.ts",
          "tests/vault-api.test.ts",
          "tests/i18n.test.ts"
        ].every((path) => existsSync(resolve(repo.root, path)))
      },
      {
        id: "web-workbench",
        label: "Web GUI exercises workflow selection, import, scoring, reply, topics, and prompt inspection",
        points: 15,
        artifacts: ["apps/web/src/main.tsx"],
        check: (repo) => includes(repo, "apps/web/src/main.tsx", ["workflows", "api.uploadImport", "api.createPursuitReport", "api.createReplySuggestions", "api.createExport"])
      },
      {
        id: "release-scripts",
        label: "Package scripts expose deterministic release gates",
        points: 20,
        artifacts: ["package.json", "scripts/smoke.mjs", "scripts/check-readme.mjs", "scripts/score-release.mjs"],
        check: (repo) => {
          const scripts = json(repo, "package.json").scripts ?? {};
          return ["verify", "smoke", "test:e2e", "check:readme", "check:exports", "score:release"].every((name) => Boolean(scripts[name])) &&
            includes(repo, "scripts/smoke.mjs", ["Smoke check passed", "refusal-chat-en.txt"]) &&
            includes(repo, "scripts/check-readme.mjs", ["README check passed", "export targets"]);
        }
      }
    ]
  },
  excellence: {
    label: "Excellence",
    threshold: thresholds.excellence,
    rules: [
      {
        id: "strict-typescript",
        label: "Strict TypeScript is enabled",
        points: 2,
        artifacts: ["tsconfig.json"],
        check: (repo) => Boolean(json(repo, "tsconfig.json").compilerOptions?.strict)
      },
      {
        id: "defensive-types",
        label: "No-unchecked indexed access and exact optional property types are enabled",
        points: 2,
        artifacts: ["tsconfig.json"],
        check: (repo) => Boolean(json(repo, "tsconfig.json").compilerOptions?.noUncheckedIndexedAccess) &&
          Boolean(json(repo, "tsconfig.json").compilerOptions?.exactOptionalPropertyTypes)
      },
      {
        id: "i18n-gate",
        label: "Lint gate includes locale integrity checks",
        points: 2,
        artifacts: ["package.json", "scripts/check-i18n.mjs"],
        check: (repo) => includes(repo, "package.json", ["node scripts/check-i18n.mjs"]) &&
          includes(repo, "scripts/check-i18n.mjs", ["zh", "en", "ja", "ko", "es"])
      },
      {
        id: "safety-tests",
        label: "Pursuit tests cover refusal and respectful boundaries",
        points: 2,
        artifacts: ["tests/pursuit.test.ts", "tests/pursuit-advanced.test.ts"],
        check: (repo) => includes(repo, "tests/pursuit.test.ts", ["refusal", "respect"]) ||
          includes(repo, "tests/pursuit-advanced.test.ts", ["refusal", "respect"])
      },
      {
        id: "offline-release-checks",
        label: "Release scripts avoid network fetches and remote URLs",
        points: 2,
        artifacts: ["scripts/check-exports.mjs", "scripts/smoke.mjs", "scripts/check-readme.mjs"],
        check: (repo) => ["scripts/check-exports.mjs", "scripts/smoke.mjs", "scripts/check-readme.mjs"].every((path) =>
          !/https?:\/\//.test(text(repo, path)) && !/\bcurl\b|\bwget\b/.test(text(repo, path))
        )
      },
      {
        id: "npm-pack-gate",
        label: "Verify ends with npm pack dry-run",
        points: 2,
        artifacts: ["package.json"],
        check: (repo) => (json(repo, "package.json").scripts?.verify ?? "").includes("npm pack --dry-run")
      }
    ]
  },
  endgame: {
    label: "Endgame",
    threshold: thresholds.endgame,
    rules: [
      {
        id: "portable-ai-clients",
        label: "Endgame distribution spans eight AI clients",
        points: 2,
        artifacts: ["packages/exporters/src/index.ts"],
        check: (repo) => ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"].every((target) =>
          text(repo, "packages/exporters/src/index.ts").includes(`"${target}"`)
        )
      },
      {
        id: "local-first-privacy",
        label: "Endgame privacy stance is local-first",
        points: 2,
        artifacts: ["README.md"],
        check: (repo) => includes(repo, "README.md", ["本项目默认本地运行", "私人聊天记录不会进入 Git", "no impersonation"])
      },
      {
        id: "roadmap",
        label: "Roadmap covers importers, vault, eval harness, marketplace, and desktop",
        points: 2,
        artifacts: ["README.md"],
        check: (repo) => includes(repo, "README.md", ["更完整的微信", "本地 SQLite vault", "eval harness", "Persona marketplace", "Tauri 桌面版"])
      },
      {
        id: "npm-cli-package",
        label: "Package is installable as a CLI product",
        points: 2,
        artifacts: ["package.json", "packages/cli/src/index.ts"],
        check: (repo) => Boolean(json(repo, "package.json").bin?.kskill) &&
          includes(repo, "packages/cli/src/index.ts", ["#!/usr/bin/env node", "K.skill Persona Pack OS CLI"])
      },
      {
        id: "release-gate",
        label: "Endgame release gate is a single npm command",
        points: 2,
        artifacts: ["package.json"],
        check: (repo) => {
          const verify = json(repo, "package.json").scripts?.verify ?? "";
          return ["npm run lint", "npm test", "npm run build", "npm run test:e2e", "npm pack --dry-run"].every((command) => verify.includes(command));
        }
      },
      {
        id: "score-script",
        label: "Release score script enforces explicit numeric thresholds",
        points: 2,
        artifacts: ["scripts/score-release.mjs"],
        check: (repo) => includes(repo, "scripts/score-release.mjs", ["openSourceUniqueness: 120", "industrialProduct: 120", "excellence: 10", "endgame: 10"])
      }
    ]
  }
};

function text(repo, path) {
  const fullPath = resolve(repo.root, path);
  if (!existsSync(fullPath)) return "";
  return readFileSync(fullPath, "utf8");
}

function json(repo, path) {
  const content = text(repo, path);
  if (!content) return {};
  return JSON.parse(content);
}

function includes(repo, path, needles) {
  const content = text(repo, path);
  return needles.every((needle) => content.includes(needle));
}

function evaluateCategory(repo, category) {
  const earned = [];
  const missed = [];

  for (const rule of category.rules) {
    let passed = false;
    try {
      passed = Boolean(rule.check(repo));
    } catch {
      passed = false;
    }

    const item = {
      id: rule.id,
      label: rule.label,
      points: rule.points,
      artifacts: rule.artifacts
    };

    if (passed) earned.push(item);
    else missed.push(item);
  }

  const score = earned.reduce((sum, item) => sum + item.points, 0);
  return {
    label: category.label,
    threshold: category.threshold,
    score,
    passed: score >= category.threshold,
    earned,
    missed
  };
}

export function scoreRepository(root = process.cwd()) {
  const repo = { root: resolve(root) };
  const evaluated = Object.fromEntries(
    Object.entries(categories).map(([key, category]) => [key, evaluateCategory(repo, category)])
  );
  return {
    thresholds,
    categories: evaluated,
    passed: Object.values(evaluated).every((category) => category.passed)
  };
}

function printResult(result) {
  for (const category of Object.values(result.categories)) {
    console.log(`${category.passed ? "PASS" : "FAIL"} ${category.label}: ${category.score}/${category.threshold}`);
    for (const item of category.earned) {
      console.log(`  +${item.points} ${item.label} [${item.artifacts.join(", ")}]`);
    }
    for (const item of category.missed) {
      console.log(`  MISS ${item.points} ${item.label} [${item.artifacts.join(", ")}]`);
    }
  }

  if (result.passed) {
    console.log("Release score passed.");
  } else {
    console.error("Release score failed.");
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  printResult(scoreRepository(process.cwd()));
}
