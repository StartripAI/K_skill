import { parseChatText } from "../packages/importers/src/index.ts";
import { analyzePursuit, assessSendDecision, generateReplyLab } from "../packages/pursuit/src/index.ts";

describe("advanced Crush Coach", () => {
  test("reports latest turns, trend, date readiness, style match, and reply lab", () => {
    const parsed = parseChatText(`
我: 你最近还在拍街边小店吗
TA: 在呀 我周末可能去老城区
我: 那边咖啡店也多
TA: 哈哈你怎么这么懂 你也喜欢这种地方吗？
我: 有点 想听你推荐
TA: 可以啊 我有一串收藏
`);
    const report = analyzePursuit(parsed.messages, { userName: "我", targetName: "TA", goal: "ask_out", latestMessage: "我有一串收藏", maxTurns: 10 });
    expect(report.latestTurns.length).toBeLessThanOrEqual(10);
    expect(report.relationshipStage.id).toBe("date_window");
    expect(report.trend.direction).toBe("rising");
    expect(report.dateReadiness.verdict).toMatch(/soft_invite_ok|ready/);
    expect(report.styleMatch.questionRate).toBeGreaterThan(0);
    expect(generateReplyLab(report).variants.length).toBeGreaterThanOrEqual(5);
  });

  test("hard boundary blocks escalation and send-or-not refuses pressure", () => {
    const parsed = parseChatText(`
Me: Dinner Friday?
TA: I don't want to date. Please stop asking.
Me: But why?
TA: Please respect that.
`);
    const report = analyzePursuit(parsed.messages, { userName: "Me", targetName: "TA", goal: "write_reply", draftMessage: "Come on, just one dinner." });
    expect(report.boundary.severity).toBe("hard_stop");
    expect(report.safety.allowEscalation).toBe(false);
    expect(assessSendDecision(report, "Come on, just one dinner.").kind).toBe("refuse");
    const lab = generateReplyLab(report);
    expect(lab.allowEscalation).toBe(false);
    expect(lab.variants.every((item) => item.boundarySafe)).toBe(true);
    expect(lab.variants.every((item) => item.intent === "close" || item.intent === "apology")).toBe(true);
    expect(lab.variants.map((item) => item.text).join(" ")).not.toMatch(/dinner|date|try|chance/i);
  });
});
