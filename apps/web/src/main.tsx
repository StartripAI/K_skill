import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Archive, Brain, Download, FileUp, Heart, Languages, MessageCircleHeart, Search, ShieldCheck, Sparkles, Upload, WandSparkles } from "lucide-react";
import { createPersonaPack, inspectPromptStack, type PackLanguage, type PersonaPack, type PersonaType } from "../../../packages/core/src/index.ts";
import { distillPersonaPack } from "../../../packages/distiller/src/index.ts";
import { parseChatText } from "../../../packages/importers/src/index.ts";
import { analyzePursuit, generateReplySuggestions, generateTopicPlan, renderPursuitReport, type PursuitGoal, type ReplyStyle } from "../../../packages/pursuit/src/index.ts";
import { messages, type Locale } from "../../../packages/i18n/src/index.ts";
import "./styles.css";

const exportTargets = ["codex", "claude", "chatgpt", "deepseek", "sillytavern", "hermes", "lobe", "openwebui"] as const;
const demoChat = `我: 今天那家咖啡店还挺适合看书的
TA: 哈哈哈你终于发现了 我上次就说那里安静
我: 你最近还在看那个展吗
TA: 在看！周末可能去 你也喜欢这种吗？
我: 有点兴趣
TA: 那你可以先看他们那个短片 还挺有意思`;

const workflows: Array<{ id: PersonaType | "pursuit"; icon: React.ReactNode; titleKey: keyof typeof messages.zh; copy: string }> = [
  { id: "relationship", icon: <Heart size={18} />, titleKey: "relationship", copy: "从聊天、照片描述、共同经历里生成关系记忆和人格语气。" },
  { id: "character", icon: <Sparkles size={18} />, titleKey: "character", copy: "导入原创设定、角色卡、世界观，把角色变成可移植 persona pack。" },
  { id: "advisor", icon: <Brain size={18} />, titleKey: "mentor", copy: "像 Nuwa 一样抽取心智模型、表达 DNA、决策启发式和诚实边界。" },
  { id: "pursuit", icon: <MessageCircleHeart size={18} />, titleKey: "pursuit", copy: "上传你和 TA 的聊天记录，判断热度、边界、话题窗口，并生成可直接发送的回复。" }
];

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [workflow, setWorkflow] = useState<PersonaType | "pursuit">("pursuit");
  const [chatText, setChatText] = useState(demoChat);
  const [packName, setPackName] = useState("K Demo Persona");
  const [me, setMe] = useState("我");
  const [ta, setTa] = useState("TA");
  const [goal, setGoal] = useState<PursuitGoal>("ask_out");
  const [latest, setLatest] = useState("周末可能去 你也喜欢这种吗？");
  const [replyStyle, setReplyStyle] = useState<ReplyStyle>("natural");
  const lang: PackLanguage = locale === "zh" || locale === "en" || locale === "ja" || locale === "ko" || locale === "es" ? locale : "zh";

  const parsed = useMemo(() => parseChatText(chatText, { language: lang, name: "workspace-paste" }), [chatText, lang]);
  const pack = useMemo<PersonaPack>(() => {
    const type: PersonaType = workflow === "pursuit" ? "pursuit" : workflow;
    return distillPersonaPack(createPersonaPack({ name: packName, type, language: lang }), parsed);
  }, [workflow, packName, lang, parsed]);
  const report = useMemo(() => analyzePursuit(parsed.messages, { userName: me, targetName: ta, goal, language: lang }), [parsed, me, ta, goal, lang]);
  const replies = useMemo(() => generateReplySuggestions(report, latest, replyStyle), [report, latest, replyStyle]);
  const topics = useMemo(() => generateTopicPlan(report), [report]);
  const stack = useMemo(() => inspectPromptStack(pack), [pack]);

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="mark">K</div>
          <div>
            <h1>K.skill</h1>
            <p>{messages[locale].tagline}</p>
          </div>
        </div>
        <label className="locale">
          <Languages size={16} />
          <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="es">Español</option>
          </select>
        </label>
        <nav className="workflow-list">
          {workflows.map((item) => (
            <button key={item.id} className={workflow === item.id ? "active" : ""} onClick={() => setWorkflow(item.id)}>
              {item.icon}
              <span>{messages[locale][item.titleKey]}</span>
            </button>
          ))}
        </nav>
        <section className="export-card">
          <h2><Download size={16} /> Export targets</h2>
          <div className="target-grid">
            {exportTargets.map((target) => <span key={target}>{target}</span>)}
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local-first persona workbench</p>
            <h2>{workflow === "pursuit" ? "Crush Coach / 我要追TA" : messages[locale].appTitle}</h2>
          </div>
          <button className="primary" onClick={() => downloadText("pursuit_report.md", renderPursuitReport(report))}>
            <Archive size={16} /> Save report
          </button>
        </header>

        <div className="grid">
          <section className="panel intake">
            <div className="panel-title">
              <FileUp size={18} />
              <h3>{messages[locale].upload}</h3>
            </div>
            <div className="dropzone">
              <Upload size={24} />
              <strong>Drop .txt / .json / .csv / .html / card files here</strong>
              <span>Browser demo keeps data in memory. CLI supports real local files.</span>
            </div>
            <label>
              Pack name
              <input value={packName} onChange={(event) => setPackName(event.target.value)} />
            </label>
            <label>
              {messages[locale].paste}
              <textarea value={chatText} onChange={(event) => setChatText(event.target.value)} rows={11} />
            </label>
          </section>

          <section className="panel coach">
            <div className="panel-title">
              <MessageCircleHeart size={18} />
              <h3>{messages[locale].pursuit}</h3>
            </div>
            <div className="form-row">
              <label>Me<input value={me} onChange={(event) => setMe(event.target.value)} /></label>
              <label>TA<input value={ta} onChange={(event) => setTa(event.target.value)} /></label>
            </div>
            <label>
              Goal
              <select value={goal} onChange={(event) => setGoal(event.target.value as PursuitGoal)}>
                <option value="break_ice">想破冰</option>
                <option value="continue_chat">想延续聊天</option>
                <option value="ask_out">想约出来</option>
                <option value="judge_chance">想判断有没有机会</option>
                <option value="recover_cold_chat">想挽回冷掉的对话</option>
                <option value="write_reply">想写一条现在就能发的回复</option>
              </select>
            </label>
            <div className={`stage ${report.stage}`}>
              <span>Stage</span>
              <strong>{report.stage}</strong>
              <em>{Math.round(report.confidence * 100)}%</em>
            </div>
            <div className="signal-grid">
              <div>
                <b>Warmth</b>
                <span>{report.warmthSignals.length} signals</span>
              </div>
              <div>
                <b>Risk</b>
                <span>{report.riskSignals.length} signals</span>
              </div>
              <div>
                <b>Action</b>
                <span>{report.strategy.action}</span>
              </div>
            </div>
            <p className="strategy">{report.strategy.summary}</p>
            <p className="next">{report.strategy.nextMove}</p>
          </section>
        </div>

        <section className="panel reply-lab">
          <div className="panel-title">
            <WandSparkles size={18} />
            <h3>{messages[locale].replyLab}</h3>
          </div>
          <div className="reply-controls">
            <label>TA latest<input value={latest} onChange={(event) => setLatest(event.target.value)} /></label>
            <label>Style
              <select value={replyStyle} onChange={(event) => setReplyStyle(event.target.value as ReplyStyle)}>
                <option value="natural">自然</option>
                <option value="humorous">幽默</option>
                <option value="sincere">真诚</option>
                <option value="restrained">克制</option>
                <option value="direct">直球</option>
                <option value="gentle">温柔</option>
              </select>
            </label>
          </div>
          <div className="reply-grid">
            {replies.map((reply) => (
              <article key={reply.label} className="reply-card">
                <h4>{reply.label}</h4>
                <p className="bubble">{reply.text}</p>
                <small>{reply.why}</small>
                <small>{reply.risk}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel topics">
          <div className="panel-title">
            <Search size={18} />
            <h3>Topic Plan</h3>
          </div>
          <div className="topic-columns">
            <div><b>Low risk</b>{topics.lowRiskTopics.slice(0, 5).map((topic) => <span key={topic}>{topic}</span>)}</div>
            <div><b>Interest-based</b>{topics.interestBasedTopics.map((topic) => <span key={topic}>{topic}</span>)}</div>
            <div><b>Do not</b>{topics.avoidTopics.map((topic) => <span key={topic}>{topic}</span>)}</div>
          </div>
        </section>
      </section>

      <aside className="inspector">
        <div className="panel-title">
          <ShieldCheck size={18} />
          <h3>Prompt Stack</h3>
        </div>
        <p className="muted">{messages[locale].safety}</p>
        {stack.layers.map((layer) => (
          <details key={layer.name} open={layer.name === "identity" || layer.name === "boundaries"}>
            <summary>
              <span>{layer.name}</span>
              <em>{layer.tokensEstimate} tok</em>
            </summary>
            <pre>{layer.content}</pre>
          </details>
        ))}
      </aside>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
