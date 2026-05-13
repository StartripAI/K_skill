import { createPersonaPack } from "../packages/core/src/index.ts";
import { parseChatText } from "../packages/importers/src/index.ts";
import { distillPersonaPackAsync } from "../packages/distiller/src/index.ts";

describe("LLM distillation pipeline", () => {
  test("keeps deterministic fallback when provider is none", async () => {
    const pack = createPersonaPack({ name: "Fallback", type: "relationship", language: "zh" });
    const source = parseChatText("我: 还记得书店吗\nTA: 当然 你把伞落在那里了");
    const result = await distillPersonaPackAsync(pack, source, { provider: "none" });
    expect(result.pack.distillation.runs.at(-1)?.mode).toBe("heuristic");
    expect(result.usedFallback).toBe(true);
  });

  test("schema-valid mocked provider output is merged with evidence", async () => {
    const pack = createPersonaPack({ name: "LLM", type: "advisor", language: "en" });
    const source = parseChatText("Me: Pick a direction\nTA: Reversible decisions should be tested quickly");
    const result = await distillPersonaPackAsync(pack, source, {
      provider: "openai-compatible",
      model: "mock",
      completion: async () => ({
        evidence: [{ id: "e1", quote: "Reversible decisions should be tested quickly", claim: "Values reversible experiments", confidence: 0.9 }],
        claims: [{ id: "c1", text: "Tests reversible choices quickly", evidenceIds: ["e1"], confidence: 0.9 }],
        episodes: [],
        voice: ["concise"],
        expressionDna: ["decision-first"],
        heuristics: ["Test reversible choices quickly."],
        mentalModels: [{ name: "Reversible experiments", description: "Treat reversible decisions as tests.", evidenceIds: ["e1"], confidence: 0.9 }],
        contradictions: [],
        evals: []
      })
    });
    expect(result.pack.mentalModels.some((model) => model.name === "Reversible experiments")).toBe(true);
    expect(result.pack.distillation.runs.at(-1)?.mode).toBe("llm");
  });

  test("retries invalid drafts before accepting schema-valid provider output", async () => {
    const pack = createPersonaPack({ name: "Retry", type: "advisor", language: "en" });
    const source = parseChatText("Me: What matters?\nTA: Keep claims tied to receipts.");
    let attempts = 0;

    const result = await distillPersonaPackAsync(pack, source, {
      provider: "openai-compatible",
      model: "mock",
      maxAttempts: 2,
      completion: async () => {
        attempts += 1;
        if (attempts === 1) return { evidence: "not-an-array" };
        return {
          evidence: [{ quote: "Keep claims tied to receipts.", claim: "Grounds claims in evidence.", confidence: 0.91 }],
          claims: [{ text: "Grounds advice in evidence.", evidenceIds: [], confidence: 0.88 }],
          episodes: [],
          voice: ["evidence-first"],
          expressionDna: ["receipt language"],
          heuristics: ["Tie claims to receipts."],
          mentalModels: [],
          contradictions: [],
          evals: []
        };
      }
    });

    expect(attempts).toBe(2);
    expect(result.usedFallback).toBe(false);
    expect(result.pack.identity.voice).toContain("evidence-first");
  });

  test("requireLlm throws instead of falling back when provider output never validates", async () => {
    const pack = createPersonaPack({ name: "Strict", type: "advisor", language: "en" });
    const source = parseChatText("Me: Decide\nTA: Not enough evidence yet.");

    await expect(
      distillPersonaPackAsync(pack, source, {
        provider: "openai-compatible",
        model: "mock",
        requireLlm: true,
        maxAttempts: 2,
        completion: async () => ({ evidence: "invalid" })
      })
    ).rejects.toThrow(/LLM distillation required/i);
  });
});
