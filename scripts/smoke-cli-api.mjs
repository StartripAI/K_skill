import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function moduleUrl(path) {
  return pathToFileURL(resolve(root, path)).href;
}

const tmp = mkdtempSync(join(tmpdir(), "kskill-cli-api-"));

try {
  const tsx = resolve(root, "node_modules/.bin/tsx");
  assert(existsSync(tsx), "Local tsx binary was not found. Run npm install.");

  const cli = resolve(root, "packages/cli/src/index.ts");
  const voice = resolve(root, "tests/fixtures/media/voice-note-zh.wav");
  const transcriptOut = join(tmp, "transcript.json");
  const packDir = join(tmp, "voice-pack");
  const audioOut = join(tmp, "preview.wav");
  const cloneOut = join(tmp, "memory-voice.wav");

  execFileSync(tsx, [cli, "init", "Voice Smoke", "--type", "pursuit", "--language", "zh", "--out", packDir], { cwd: root, stdio: "pipe" });
  execFileSync(tsx, [cli, "transcribe", voice, "--provider", "stub-asr", "--language", "zh", "--out", transcriptOut], { cwd: root, stdio: "pipe" });
  execFileSync(tsx, [cli, "speak", packDir, "--text", "周末去看展，轻松一点。", "--provider", "stub-tts", "--out", audioOut], { cwd: root, stdio: "pipe" });
  execFileSync(tsx, [cli, "speak", packDir, "--text", "我还记得你说这句话的语气。", "--provider", "local-voice-clone", "--reference-audio", voice, "--out", cloneOut], {
    cwd: root,
    stdio: "pipe",
    env: { ...process.env, KSKILL_LOCAL_TTS_COMMAND: `node ${resolve(root, "examples/local-voice-engine.mjs")}` }
  });
  execFileSync(tsx, [cli, "voice-profile", packDir], { cwd: root, stdio: "pipe" });

  const transcript = JSON.parse(readFileSync(transcriptOut, "utf8"));
  assert(transcript.providerId === "stub-asr", "CLI transcribe did not use stub-asr");
  assert(readFileSync(audioOut, "utf8").includes("KSKILL_STUB_WAV"), "CLI speak did not write deterministic audio bytes");
  assert(readFileSync(cloneOut, "utf8").includes("KSKILL_LOCAL_VOICE_ENGINE"), "CLI speak did not invoke the local voice clone adapter");
  assert(existsSync(`${audioOut}.manifest.json`), "CLI speak did not write a TTS manifest");

  const runner = join(tmp, "api-runner.mjs");
  writeFileSync(
    runner,
    `
import { readFileSync } from "node:fs";
import { openVault } from ${JSON.stringify(moduleUrl("packages/vault/src/index.ts"))};
import { createKskillApp } from ${JSON.stringify(moduleUrl("packages/server/src/index.ts"))};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const vault = openVault(${JSON.stringify(join(tmp, "api-vault.sqlite"))});
const app = createKskillApp({ vault, staticDir: ${JSON.stringify(join(root, "dist-web"))} });
const health = await app.request("/api/health");
assert(health.status === 200, "health endpoint failed");

const providers = await (await app.request("/api/voice/providers")).json();
assert(providers.data.providers.some((provider) => provider.id === "stub-asr" && provider.kind === "asr"), "provider list missing stub-asr");

const form = new FormData();
form.set("packName", "API Voice Smoke");
form.set("type", "pursuit");
form.set("language", "zh");
form.set("consentConfirmed", "true");
form.append("files", new File([readFileSync(${JSON.stringify(voice)})], "voice-note-zh.wav", { type: "audio/wav" }));
const imported = await app.request("/api/imports", { method: "POST", body: form });
assert(imported.status === 200, "mixed import endpoint failed");
const importedJson = await imported.json();
assert(importedJson.data.preview.assetCount >= 1, "mixed import preview missing asset count");
assert(importedJson.data.preview.transcriptCount >= 1, "mixed import preview missing transcript count");

const tts = await app.request("/api/voice/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "hello", providerId: "stub-tts", language: "en" }) });
assert(tts.status === 200, "tts endpoint failed");
assert(tts.headers.get("x-kskill-sha256"), "tts response missing hash header");
vault.close();
`,
    "utf8"
  );
  execFileSync(tsx, [runner], { cwd: root, stdio: "pipe" });

  console.log("CLI/API smoke passed: transcribe, speak, local voice clone adapter, voice-profile, ASR import, TTS endpoint.");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
