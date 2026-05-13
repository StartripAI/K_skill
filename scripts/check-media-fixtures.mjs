import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const required = [
  "tests/fixtures/media/voice-note-zh.wav",
  "tests/fixtures/media/voice-note-en.wav",
  "tests/fixtures/media/chat-with-attachments.json",
  "tests/fixtures/media/video-note.vtt",
  "tests/fixtures/media/sticker.webp",
  "tests/fixtures/media/screenshot.png"
];

for (const path of required) {
  const absolute = resolve(root, path);
  assert(existsSync(absolute), `Missing media fixture: ${path}`);
  const stat = statSync(absolute);
  assert(stat.size > 8, `Media fixture is empty: ${path}`);
  assert(stat.size < 512_000, `Media fixture is too large for repository tests: ${path}`);
}

const voiceZh = readFileSync(resolve(root, "tests/fixtures/media/voice-note-zh.wav"), "utf8");
const voiceEn = readFileSync(resolve(root, "tests/fixtures/media/voice-note-en.wav"), "utf8");
const vtt = readFileSync(resolve(root, "tests/fixtures/media/video-note.vtt"), "utf8");

assert(voiceZh.includes("周末"), "Chinese ASR fixture must contain a human-readable transcript fallback");
assert(voiceEn.includes("coffee"), "English ASR fixture must contain a human-readable transcript fallback");
assert(vtt.includes("WEBVTT") && vtt.includes("-->"), "Video transcript fixture must be valid VTT-shaped text");

console.log(`Media fixture check passed: ${required.length} fixture files are present and small.`);
