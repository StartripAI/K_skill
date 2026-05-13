import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
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

function localImagePaths(markdown) {
  const paths = new Set();
  for (const match of markdown.matchAll(/!\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1]?.trim();
    if (target && !/^https?:\/\//i.test(target) && !target.startsWith("#")) paths.add(target);
  }
  for (const match of markdown.matchAll(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const target = match[1]?.trim();
    if (target && !/^https?:\/\//i.test(target) && !target.startsWith("#")) paths.add(target);
  }
  return [...paths];
}

function pngDimensions(path) {
  const buffer = readFileSync(resolve(root, path));
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return undefined;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function assertImage(path) {
  requireFile(path);
  const ext = extname(path).toLowerCase();
  if (ext === ".png") {
    const dimensions = pngDimensions(path);
    assert(dimensions, `${path} is not a readable PNG`);
    assert(dimensions.width >= 1000, `${path} is too narrow for README use`);
    assert(dimensions.height >= 600, `${path} is too short for README use`);
    assert(statSync(resolve(root, path)).size <= 3_000_000, `${path} is larger than 3MB`);
  }
  if (ext === ".svg") {
    const svg = read(path);
    assert(svg.includes("<title"), `${path} is missing <title>`);
    assert(svg.includes("<desc"), `${path} is missing <desc>`);
    assert(svg.includes("viewBox"), `${path} is missing viewBox`);
  }
}

function assertNoForbiddenREADMEClaims(path, content) {
  const forbidden = [
    ["ex", "skill"].join("-"),
    ["nuwa", "skill"].join("-"),
    ["ST", "memory"].join(" "),
    ["thereal", "XiaomanChu"].join(""),
    ["per", "kfly"].join(""),
    ["al", "chaincyf"].join(""),
    ["mu", "yoou"].join(""),
    ["参考", "项目"].join(""),
    ["借", "鉴"].join(""),
    ["base", "line"].join("")
  ];
  for (const word of forbidden) {
    assert(!content.includes(word), `${path} must not mention outside comparison wording: ${word}`);
  }
}

const packageJson = JSON.parse(read("package.json"));
const exporterSource = read("packages/exporters/src/index.ts");
const readmeFiles = ["README.md", "README_EN.md", "README_JA.md", "README_KO.md", "README_ES.md"];
const requiredLocalFiles = [
  "LICENSE",
  "examples/crush-chat-zh.txt",
  "examples/crush-chat-en.txt",
  "examples/refusal-chat-en.txt",
  "examples/cold-chat-zh.txt",
  "examples/relationship-memory-chat.txt",
  "examples/character-world.md",
  "examples/movie-character.md",
  "examples/life-mentor-source.md"
];

for (const path of requiredLocalFiles) {
  requireFile(path);
}

const requiredImages = [
  "assets/readme/hero-six-scenes.png",
  "assets/readme/crush-coach-reply-lab.png",
  "assets/readme/relationship-memory-chat.png",
  "assets/readme/anime-character-world.png",
  "assets/readme/virtual-persona-chat.png",
  "assets/readme/movie-character-pack.png",
  "assets/readme/life-mentor-model.png",
  "assets/readme/web-gui-flow.png",
  "assets/readme/export-matrix.png"
];

for (const image of requiredImages) {
  assertImage(image);
}

const requiredTargets = ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"];
const requiredScripts = ["build", "dev", "cli", "lint", "test", "check:readme", "check:exports", "check:media-fixtures", "test:e2e", "smoke", "smoke:cli-api", "score:release", "verify"];
const packageScripts = packageJson.scripts ?? {};

for (const scriptName of requiredScripts) {
  assert(packageScripts[scriptName], `package.json is missing script: ${scriptName}`);
}

for (const target of requiredTargets) {
  assert(exporterSource.includes(`"${target}"`), `Exporter source is missing target: ${target}`);
}

const semanticNeedles = [
  "Crush Coach",
  "Relationship Memory",
  "Character World",
  "Movie Character",
  "Life Mentor",
  "Voice Studio",
  "ASR",
  "TTS",
  "multimodal",
  "voice note",
  "sticker intents",
  "image",
  "screenshot",
  "PDF",
  "video transcript",
  "Reply Lab",
  "Prompt Stack",
  "evidence",
  "confidence",
  "local",
  "evidence",
  "confidence",
  "Codex",
  "Claude",
  "ChatGPT",
  "DeepSeek",
  "SillyTavern",
  "Hermes",
  "LobeChat",
  "Open WebUI"
];

for (const path of readmeFiles) {
  const content = read(path);
  assert(content.includes("# K.skill"), `${path} must identify K.skill`);
  assert(content.length > 8_000, `${path} is too small to be complete product documentation`);
  assertNoForbiddenREADMEClaims(path, content);
  for (const needle of semanticNeedles) {
    assert(content.includes(needle), `${path} is missing required product concept: ${needle}`);
  }
  for (const image of requiredImages) {
    assert(content.includes(image), `${path} is missing image: ${image}`);
  }
  for (const image of localImagePaths(content)) {
    assertImage(image);
  }
  for (const scriptName of [...content.matchAll(/npm run ([a-z0-9:.-]+)/gi)].map((match) => match[1])) {
    assert(packageScripts[scriptName], `${path} documents missing package script: ${scriptName}`);
  }
  for (const target of requiredTargets) {
    assert(content.toLowerCase().includes(target), `${path} is missing export target: ${target}`);
  }
}

const zh = read("README.md");
const requiredZhHeadings = [
  "## 先看 6 个场景",
  "## 四个主工作流",
  "## GUI 怎么用",
  "## CLI 怎么用",
  "## 导出到真实工具",
  "## 隐私和使用感",
  "## 开发与验证"
];

for (const heading of requiredZhHeadings) {
  assert(zh.includes(heading), `README.md is missing heading: ${heading}`);
}

assert(!zh.includes(["精神", "导师"].join("")), "README.md must use Life Mentor instead of the legacy Chinese label");
assert(!zh.includes(["导师", " ->"].join("")), "README.md examples must use Life Mentor instead of the legacy example speaker");
assert(zh.includes("本项目默认本地运行"), "README.md must document local-first privacy");
assert(zh.includes("聊天节奏"), "README.md must describe the Crush Coach rhythm use case");
assert(zh.includes("体面收住"), "README.md must describe cooldown handling in plain language");

console.log(`README check passed: ${readmeFiles.length} locales, ${requiredImages.length} images, ${requiredTargets.length} export targets, product-only positioning.`);
