import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function moduleUrl(path) {
  return pathToFileURL(resolve(root, path)).href;
}

function runRunner(tmp) {
  const tsx = resolve(root, "node_modules/.bin/tsx");
  assert(existsSync(tsx), "Local tsx binary was not found. Run npm install.");

  const runner = join(tmp, "smoke-runner.mjs");
  writeFileSync(
    runner,
    `
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createPersonaPack, inspectPromptStack, validatePersonaPack } from ${JSON.stringify(moduleUrl("packages/core/src/index.ts"))};
import { distillPersonaPack } from ${JSON.stringify(moduleUrl("packages/distiller/src/index.ts"))};
import { parseChatText } from ${JSON.stringify(moduleUrl("packages/importers/src/index.ts"))};
import { exportPersonaPack } from ${JSON.stringify(moduleUrl("packages/exporters/src/index.ts"))};
import { analyzePursuit, generateReplySuggestions, generateTopicPlan, renderPursuitReport } from ${JSON.stringify(moduleUrl("packages/pursuit/src/index.ts"))};

const root = ${JSON.stringify(root)};
const outRoot = process.argv[2];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

mkdirSync(outRoot, { recursive: true });

const warmSource = parseChatText(readFileSync(join(root, "examples/crush-chat-zh.txt"), "utf8"), {
  name: "crush-chat-zh.txt",
  language: "zh"
});
const warmReport = analyzePursuit(warmSource.messages, { userName: "我", targetName: "TA", goal: "ask_out", language: "zh" });
const renderedReport = renderPursuitReport(warmReport);
assert(renderedReport.includes("# pursuit_report"), "Pursuit report did not render");
assert(warmReport.strategy.action === "soft_invite", "Pursuit smoke did not detect a low-pressure invite window");
assert(generateTopicPlan(warmReport).markdown.includes("## Boundaries"), "Topic plan did not include boundaries");

const refusalSource = parseChatText(readFileSync(join(root, "examples/refusal-chat-en.txt"), "utf8"), {
  name: "refusal-chat-en.txt",
  language: "en"
});
const refusalReport = analyzePursuit(refusalSource.messages, { userName: "Me", targetName: "TA", goal: "recover_cold_chat", language: "en" });
const boundaryReply = generateReplySuggestions(refusalReport, "Please stop asking.", "natural");
assert(boundaryReply[0]?.label === "Respect boundary", "Boundary reply did not use the respect-boundary path");
assert(boundaryReply[0]?.text.includes("stop asking"), "Boundary reply did not tell the user to stop asking");

const mentorSource = parseChatText(readFileSync(join(root, "examples/mentor-source.md"), "utf8"), {
  name: "mentor-source.md",
  language: "en",
  private: false,
  consentConfirmed: true
});
const pack = distillPersonaPack(createPersonaPack({ name: "Smoke Mentor", type: "advisor", language: "en" }), mentorSource);
const validation = validatePersonaPack(pack);
assert(validation.success, validation.success ? "" : validation.error.message);

const stack = inspectPromptStack(pack);
assert(stack.rendered.includes("## identity"), "Prompt stack did not include identity");
assert(stack.rendered.includes("## boundaries"), "Prompt stack did not include boundaries");

exportPersonaPack(pack, { target: "codex", outDir: join(outRoot, "codex") });
assert(existsSync(join(outRoot, "codex", "SKILL.md")), "Codex skill export missing from smoke run");

console.log("Smoke check passed: pursuit, boundary reply, pack validation, and Codex export are working.");
`,
    "utf8"
  );

  return execFileSync(tsx, [runner, join(tmp, "artifacts")], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1" }
  });
}

const tmp = mkdtempSync(join(tmpdir(), "kskill-smoke-"));

try {
  process.stdout.write(runRunner(tmp));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
