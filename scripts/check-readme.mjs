import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requireFile(path) {
  assert(existsSync(resolve(root, path)), `Missing referenced file: ${path}`);
}

const readme = read("README.md");
const packageJson = JSON.parse(read("package.json"));
const exporterSource = read("packages/exporters/src/index.ts");

const linkedFiles = [
  "assets/hero-chat-workbench.svg",
  "LICENSE",
  "README_EN.md",
  "README_JA.md",
  "README_KO.md",
  "README_ES.md",
  "examples/crush-chat-zh.txt",
  "examples/crush-chat-en.txt",
  "examples/refusal-chat-en.txt",
  "examples/mentor-source.md"
];

for (const path of linkedFiles) {
  requireFile(path);
}

const requiredHeadings = [
  "# K.skill",
  "## K.skill 是什么",
  "## 四个主工作流",
  "## 导出到各平台",
  "## Web GUI 怎么用",
  "## 隐私和安全边界",
  "## 开发与测试"
];

for (const heading of requiredHeadings) {
  assert(readme.includes(heading), `README is missing heading: ${heading}`);
}

const requiredCommands = [
  "npm install",
  "npm run build",
  "npm run dev",
  "npm run cli -- --help",
  "npm run lint",
  "npm test"
];

for (const command of requiredCommands) {
  assert(readme.includes(command), `README is missing command: ${command}`);
}

const packageScripts = packageJson.scripts ?? {};
const documentedScriptNames = [...readme.matchAll(/npm run ([a-z0-9:.-]+)/gi)].map((match) => match[1]);
for (const scriptName of new Set(documentedScriptNames)) {
  assert(packageScripts[scriptName], `README documents missing package script: ${scriptName}`);
}

const requiredTargets = ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"];
for (const target of requiredTargets) {
  assert(readme.toLowerCase().includes(target), `README is missing export target: ${target}`);
  assert(exporterSource.includes(`"${target}"`), `Exporter source is missing target: ${target}`);
}

for (const localized of ["README_EN.md", "README_JA.md", "README_KO.md", "README_ES.md"]) {
  const content = read(localized);
  assert(content.includes("K.skill"), `${localized} does not identify the project`);
  assert(content.length > 500, `${localized} is too small to be useful documentation`);
}

assert(readme.includes("不提供 PUA"), "README must document non-manipulation boundaries");
assert(readme.includes("本项目默认本地运行"), "README must document local-first privacy");

console.log(`README check passed: ${requiredHeadings.length} headings, ${requiredCommands.length} commands, ${requiredTargets.length} export targets.`);
