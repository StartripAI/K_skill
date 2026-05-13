import { parseImport } from "../packages/importers/src/index.ts";

describe("industrial importers", () => {
  test.each([
    ["wechat", "2026-05-13 09:00 我: 早呀\n2026-05-13 09:01 TA: 早！"],
    ["qq", "消息对象: TA\n2026-05-13 09:00:00 我(12345)\n在吗\n2026-05-13 09:01:00 TA(67890)\n在"],
    ["whatsapp", "13/05/2026, 09:00 - Me: Hi\n13/05/2026, 09:01 - TA: Hey!"],
    ["telegram", JSON.stringify({ messages: [{ id: 1, from: "Me", date: "2026-05-13T09:00:00", text: "Hi" }, { id: 2, from: "TA", text: "Hey!" }] })],
    ["imessage", "date,sender,text\n2026-05-13T09:00:00,Me,Hi\n2026-05-13T09:01:00,TA,Hey"],
    ["markdown", "# Character\n\n我: 进入雨档案馆\nTA: 你要查哪一场雨？"]
  ])("detects and parses %s style input without throwing", (expectedFormat, text) => {
    const result = parseImport({ name: `${expectedFormat}.txt`, text });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.import.preview.detectedFormat).toBe(expectedFormat);
      expect(result.import.messages.length).toBeGreaterThan(0);
      expect(result.diagnostics.every((item) => item.severity !== "fatal")).toBe(true);
    }
  });

  test("parses SillyTavern card v2 and embedded lorebook", () => {
    const result = parseImport({
      name: "card.json",
      text: JSON.stringify({
        spec: "chara_card_v2",
        data: {
          name: "Aoi",
          description: "Rain archive keeper",
          character_book: { entries: [{ keys: ["rain"], content: "Memories are indexed by rain." }] }
        }
      })
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.import.character?.name).toBe("Aoi");
      expect(result.import.lorebookEntries).toHaveLength(1);
    }
  });

  test("returns preview metadata for generic json and html imports", () => {
    const json = parseImport({
      name: "chat.json",
      text: JSON.stringify({ messages: [{ sender: "Me", timestamp: "2026-05-13T09:00:00Z", content: "Hi" }] })
    });
    const html = parseImport({
      name: "chat.html",
      text: "<html><body><p><b>TA:</b> Hello&nbsp;there</p></body></html>"
    });

    expect(json.ok).toBe(true);
    expect(html.ok).toBe(true);
    if (json.ok && html.ok) {
      expect(json.import.preview).toMatchObject({
        detectedFormat: "json",
        confidence: expect.any(Number),
        messageCount: 1,
        speakers: ["Me"],
        language: "en"
      });
      expect(json.import.preview.timeRange).toEqual({ start: "2026-05-13T09:00:00Z", end: "2026-05-13T09:00:00Z" });
      expect(json.import.preview.diagnostics).toBe(json.diagnostics);
      expect(html.import.preview.detectedFormat).toBe("html");
      expect(html.import.messages[0]?.text).toContain("Hello there");
    }
  });

  test("parses standalone lorebook entries", () => {
    const result = parseImport({
      name: "world.lorebook.json",
      text: JSON.stringify({
        entries: {
          "0": { key: ["archive", "rain"], content: "Rain records unlock old scenes.", order: 25, enabled: true }
        }
      })
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.import.preview.detectedFormat).toBe("lorebook");
      expect(result.import.lorebookEntries).toEqual([
        expect.objectContaining({ keys: ["archive", "rain"], content: "Rain records unlock old scenes.", priority: 25 })
      ]);
    }
  });

  test("does not throw for malformed user data and reports diagnostics", () => {
    expect(() => parseImport({ name: "broken.json", text: "{\"messages\":[" })).not.toThrow();
    const result = parseImport({ name: "broken.json", text: "{\"messages\":[" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.import.preview.detectedFormat).toBe("json");
      expect(result.import.preview.messageCount).toBe(1);
      expect(result.diagnostics.some((item) => item.severity === "error")).toBe(true);
    }
  });
});
