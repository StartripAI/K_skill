import { analyzePursuit, generateReplySuggestions, generateTopicPlan, renderPursuitReport } from "../packages/pursuit/src/index.ts";
import { parseChatText } from "../packages/importers/src/index.ts";

describe("Crush Coach / 我要追TA", () => {
  test("analyzes warm Chinese chat and returns evidence-backed next steps", () => {
    const chat = parseChatText(`
我: 今天那家咖啡店还挺适合看书的
TA: 哈哈哈你终于发现了 我上次就说那里安静
我: 你最近还在看那个展吗
TA: 在看！周末可能去 你也喜欢这种吗？
我: 有点兴趣
TA: 那你可以先看他们那个短片 还挺有意思
`);

    const report = analyzePursuit(chat.messages, {
      userName: "我",
      targetName: "TA",
      goal: "ask_out",
      language: "zh"
    });

    expect(report.stage).toBe("warm");
    expect(report.strategy.action).toBe("soft_invite");
    expect(report.warmthSignals.length).toBeGreaterThanOrEqual(2);
    expect(report.evidence.some((item) => item.quote.includes("你也喜欢"))).toBe(true);
    expect(renderPursuitReport(report)).toContain("pursuit_report");
  });

  test("detects explicit refusal and only suggests respectful boundary replies", () => {
    const chat = parseChatText(`
Me: Want to grab dinner Friday?
TA: I don't want to date. Please stop asking.
Me: Are you sure?
TA: Yes. Please respect that.
`);

    const report = analyzePursuit(chat.messages, {
      userName: "Me",
      targetName: "TA",
      goal: "recover_cold_chat",
      language: "en"
    });
    const replies = generateReplySuggestions(report, "Please respect that.", "sincere");

    expect(report.stage).toBe("boundary");
    expect(report.strategy.action).toBe("respect_boundary");
    expect(replies.every((reply) => reply.boundarySafe)).toBe(true);
    expect(replies.map((reply) => reply.text).join(" ")).toMatch(/respect|sorry|space/i);
  });

  test("generates low-risk topics and invite windows from interest evidence", () => {
    const chat = parseChatText(`
我: 你最近周末都在忙什么
TA: 看展 做饭 还有学一点摄影
我: 摄影听起来很有意思
TA: 对 我喜欢拍街边的小店
`);
    const report = analyzePursuit(chat.messages, { userName: "我", targetName: "TA", goal: "continue_chat", language: "zh" });
    const topics = generateTopicPlan(report);

    expect(topics.lowRiskTopics).toHaveLength(10);
    expect(topics.interestBasedTopics.join(" ")).toContain("摄影");
    expect(topics.boundaries.length).toBeGreaterThan(0);
  });
});
