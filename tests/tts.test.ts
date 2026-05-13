import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPersonaPack } from "../packages/core/src/index.ts";
import { synthesizeSpeech, voicePreviewManifest } from "../packages/voice/src/index.ts";

describe("Voice Studio TTS", () => {
  test("creates deterministic TTS bytes and manifest", async () => {
    const first = await synthesizeSpeech("周末去看展，语气轻一点。", { providerId: "stub-tts", language: "zh", format: "wav" });
    const second = await synthesizeSpeech("周末去看展，语气轻一点。", { providerId: "stub-tts", language: "zh", format: "wav" });
    const pack = createPersonaPack({ name: "Voice Pack", type: "pursuit", language: "zh" });
    const manifest = voicePreviewManifest(first, pack.language, pack.id);

    expect(first.sha256).toBe(second.sha256);
    expect(first.mimeType).toBe("audio/wav");
    expect(manifest.sourcePackId).toBe(pack.id);
    expect(manifest.voiceId).toContain("kskill-");
  });

  test("keeps five product languages addressable", async () => {
    const languages = ["zh", "en", "ja", "ko", "es"] as const;
    const previews = await Promise.all(languages.map((language) => synthesizeSpeech(`preview-${language}`, { providerId: "stub-tts", language })));

    expect(previews.map((item) => item.voiceId)).toHaveLength(5);
    expect(new Set(previews.map((item) => item.sha256)).size).toBe(5);
  });

  test("runs a local voice clone command adapter when configured", async () => {
    const dir = mkdtempSync(join(tmpdir(), "kskill-local-voice-"));
    const runner = join(dir, "voice-engine.mjs");
    const previous = process.env.KSKILL_LOCAL_TTS_COMMAND;
    writeFileSync(runner, `
import { writeFileSync } from "node:fs";
let body = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => body += chunk);
process.stdin.on("end", () => {
  const input = JSON.parse(body);
  writeFileSync(input.outFile, "LOCAL_VOICE_CLONE\\n" + input.text + "\\n" + input.referenceAudioPath);
  console.log(JSON.stringify({ voiceId: "local-memory-voice", durationMs: 1400, mimeType: "audio/wav" }));
});
`, "utf8");
    process.env.KSKILL_LOCAL_TTS_COMMAND = `${process.execPath} ${runner}`;
    try {
      const audio = await synthesizeSpeech("I still remember your laugh.", {
        providerId: "local-voice-clone",
        language: "en",
        voice: "memory",
        referenceAudioPath: join(dir, "reference.wav")
      });
      expect(audio.voiceId).toBe("local-memory-voice");
      expect(new TextDecoder().decode(audio.bytes)).toContain("LOCAL_VOICE_CLONE");
      expect(audio.sha256).toHaveLength(64);
    } finally {
      if (previous === undefined) delete process.env.KSKILL_LOCAL_TTS_COMMAND;
      else process.env.KSKILL_LOCAL_TTS_COMMAND = previous;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
