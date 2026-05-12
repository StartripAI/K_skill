import { createPersonaPack, inspectPromptStack, validatePersonaPack } from "../packages/core/src/index.ts";
import { distillPersonaPack } from "../packages/distiller/src/index.ts";
import { parseChatText } from "../packages/importers/src/index.ts";

describe("Persona Pack OS", () => {
  test("creates and validates a relationship persona pack with evidence and memory", () => {
    const source = parseChatText(`
我: 还记得那家雨天去的书店吗
TA: 当然 你当时还把伞落在那里了
我: 你怎么什么都记得
TA: 因为你每次紧张都会忘东西
`);
    const pack = distillPersonaPack(
      createPersonaPack({ name: "Rain Bookstore", type: "relationship", language: "zh" }),
      source
    );

    expect(validatePersonaPack(pack).success).toBe(true);
    expect(pack.memory.episodes.length).toBeGreaterThan(0);
    expect(pack.distillation.evidence.length).toBeGreaterThan(0);
    expect(inspectPromptStack(pack).layers.map((layer) => layer.name)).toEqual(
      expect.arrayContaining(["identity", "memory", "boundaries"])
    );
  });
});
