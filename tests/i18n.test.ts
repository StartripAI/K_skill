import { messages, supportedLocales } from "../packages/i18n/src/index.ts";

describe("i18n", () => {
  test("keeps all required language packs key-complete", () => {
    const baseKeys = Object.keys(messages.zh).sort();
    expect(supportedLocales).toEqual(["zh", "en", "ja", "ko", "es"]);

    for (const locale of supportedLocales) {
      expect(Object.keys(messages[locale]).sort()).toEqual(baseKeys);
    }
  });
});
