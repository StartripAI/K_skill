import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strToU8, zipSync } from "fflate";
import { classifyMediaFile, parseMediaBundle, parseMediaFile, vttToPlainText } from "../packages/media/src/index.ts";

const fixtures = join(process.cwd(), "tests", "fixtures", "media");

describe("multimodal importers", () => {
  test("classifies core media kinds used by chat exports", () => {
    expect(classifyMediaFile({ name: "voice.m4a" }).kind).toBe("audio");
    expect(classifyMediaFile({ name: "chat-screenshot.png" }).kind).toBe("image");
    expect(classifyMediaFile({ name: "funny-sticker.webp" }).kind).toBe("sticker");
    expect(classifyMediaFile({ name: "notes.pdf" }).kind).toBe("pdf");
    expect(classifyMediaFile({ name: "bundle.zip" }).kind).toBe("mixed");
  });

  test("imports image, sticker, and video transcript sidecars", async () => {
    const image = await parseMediaFile({ name: "screenshot.png", bytes: new Uint8Array(readFileSync(join(fixtures, "screenshot.png"))), mimeType: "image/png" });
    const sticker = await parseMediaFile({ name: "sticker.webp", bytes: new Uint8Array(readFileSync(join(fixtures, "sticker.webp"))), mimeType: "image/webp" });
    const transcript = await parseMediaFile({ name: "video-note.vtt", bytes: new Uint8Array(readFileSync(join(fixtures, "video-note.vtt"))), mimeType: "text/vtt" });

    expect(image.assets[0]?.asset.kind).toBe("image");
    expect(sticker.assets[0]?.asset.kind).toBe("sticker");
    expect(vttToPlainText(readFileSync(join(fixtures, "video-note.vtt"), "utf8"))).toContain("interview");
    expect(transcript.sources[0]?.source.type).toBe("transcript");
  });

  test("parses a mixed zip bundle into sources, assets, and transcripts", async () => {
    const zipped = zipSync({
      "dm.txt": strToU8("我: 这张截图就是现场\nTA: 哈哈我喜欢这个氛围"),
      "voice-note-en.wav": new Uint8Array(readFileSync(join(fixtures, "voice-note-en.wav"))),
      "screenshot.png": new Uint8Array(readFileSync(join(fixtures, "screenshot.png")))
    });
    const parsed = await parseMediaBundle({ name: "chat-bundle.zip", bytes: zipped, mimeType: "application/zip" }, { asr: { providerId: "stub-asr", language: "en" } });

    expect(parsed.sources.length).toBeGreaterThanOrEqual(3);
    expect(parsed.assets.some((item) => item.asset.kind === "audio")).toBe(true);
    expect(parsed.assets.some((item) => item.asset.kind === "image")).toBe(true);
    expect(parsed.asrResults[0]?.text).toContain("coffee");
  });
});
