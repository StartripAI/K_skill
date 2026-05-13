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
});
