import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

  const runner = join(tmp, "check-exports-runner.mjs");
  writeFileSync(
    runner,
    `
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPersonaPack, inspectPromptStack, renderPersonaMarkdown, validatePersonaPack } from ${JSON.stringify(moduleUrl("packages/core/src/index.ts"))};
import { distillPersonaPack } from ${JSON.stringify(moduleUrl("packages/distiller/src/index.ts"))};
import { parseChatText } from ${JSON.stringify(moduleUrl("packages/importers/src/index.ts"))};
import { exportPersonaPack } from ${JSON.stringify(moduleUrl("packages/exporters/src/index.ts"))};

const root = ${JSON.stringify(root)};
const outRoot = process.argv[2];
const targets = ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectFile(path) {
  assert(existsSync(path), \`Missing export artifact: \${path}\`);
  return readFileSync(path, "utf8");
}

const source = parseChatText(readFileSync(join(root, "examples/mentor-source.md"), "utf8"), {
  name: "mentor-source.md",
  language: "en",
  private: false,
  consentConfirmed: true
});
const pack = distillPersonaPack(createPersonaPack({ name: "Release Mentor", type: "advisor", language: "en" }), source);
const validation = validatePersonaPack(pack);
assert(validation.success, validation.success ? "" : validation.error.message);

mkdirSync(outRoot, { recursive: true });
writeFileSync(join(outRoot, "persona.md"), renderPersonaMarkdown(pack), "utf8");
writeFileSync(join(outRoot, "prompt-stack.md"), inspectPromptStack(pack).rendered, "utf8");

for (const target of targets) {
  exportPersonaPack(pack, { target, outDir: join(outRoot, "exports", target) });
}

expectFile(join(outRoot, "exports", "codex", "SKILL.md"));
expectFile(join(outRoot, "exports", "codex", "references", "persona.md"));
expectFile(join(outRoot, "exports", "claude", "SKILL.md"));
expectFile(join(outRoot, "exports", "chatgpt", "instructions.md"));
expectFile(join(outRoot, "exports", "chatgpt", "knowledge", "boundaries.md"));
JSON.parse(expectFile(join(outRoot, "exports", "deepseek", "system-prompt.json")));

const characterCard = JSON.parse(expectFile(join(outRoot, "exports", "sillytavern", "character-card-v2.json")));
assert(characterCard.spec === "chara_card_v2", "SillyTavern export is not a v2 character card");

expectFile(join(outRoot, "exports", "hermes", "SOUL.md"));
expectFile(join(outRoot, "exports", "hermes", "skills", "release-mentor", "SKILL.md"));

const lobe = JSON.parse(expectFile(join(outRoot, "exports", "lobe", "lobe-agent.json")));
assert(lobe.author === "K.skill", "Lobe export is missing K.skill author metadata");

const openWebUi = JSON.parse(expectFile(join(outRoot, "exports", "openwebui", "openwebui-agent.json")));
assert(openWebUi.name === "Release Mentor", "Open WebUI export has the wrong agent name");

console.log(\`Export check passed: \${targets.length} targets generated and validated.\`);
`,
    "utf8"
  );

  return execFileSync(tsx, [runner, join(tmp, "artifacts")], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1" }
  });
}

const tmp = mkdtempSync(join(tmpdir(), "kskill-exports-"));

try {
  process.stdout.write(runRunner(tmp));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
