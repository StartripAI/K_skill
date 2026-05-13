import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMediaFile } from "../packages/media/src/index.ts";
import { transcribeAudio } from "../packages/voice/src/index.ts";

const fixtures = join(process.cwd(), "tests", "fixtures", "media");

describe("Voice Studio ASR", () => {
  test("transcribes a Chinese voice fixture without network", async () => {
    const bytes = new Uint8Array(readFileSync(join(fixtures, "voice-note-zh.wav")));
    const result = await transcribeAudio({ bytes, filename: "voice-note-zh.wav", mimeType: "audio/wav" }, { providerId: "stub-asr", language: "zh" });

    expect(result.providerId).toBe("stub-asr");
    expect(result.language).toBe("zh");
    expect(result.text).toContain("周末");
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.segments.length).toBeGreaterThan(0);
  });

  test("turns audio into transcript-backed media evidence", async () => {
    const bytes = new Uint8Array(readFileSync(join(fixtures, "voice-note-en.wav")));
    const parsed = await parseMediaFile({ name: "voice-note-en.wav", bytes, mimeType: "audio/wav" }, { asr: { providerId: "stub-asr", language: "en" } });

    expect(parsed.sources).toHaveLength(1);
    expect(parsed.assets).toHaveLength(1);
    expect(parsed.asrResults[0]?.text).toContain("coffee");
    expect(parsed.sources[0]?.messages[0]?.attachments?.[0]?.kind).toBe("audio");
    expect(parsed.sources[0]?.messages[0]?.transcripts?.[0]?.provider).toBe("stub-asr");
  });
});
