import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const out = resolve(root, "assets/readme/voice-memory-studio.png");
mkdirSync(dirname(out), { recursive: true });

const bars = Array.from({ length: 52 }, (_, index) => {
  const height = 18 + Math.round(Math.abs(Math.sin(index * 0.72)) * 74) + (index % 7) * 3;
  return `<i style="height:${height}px"></i>`;
}).join("");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1600px;
    height: 1000px;
    overflow: hidden;
    font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
    background:
      radial-gradient(circle at 18% 12%, rgba(255, 112, 150, .20), transparent 28%),
      radial-gradient(circle at 80% 18%, rgba(84, 145, 255, .16), transparent 32%),
      linear-gradient(135deg, #fff9f2 0%, #f4f7fb 54%, #fff3f5 100%);
    color: #14151a;
  }
  .frame {
    position: relative;
    width: 1600px;
    height: 1000px;
    padding: 58px;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 40px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 16px;
    font-weight: 850;
    letter-spacing: -.01em;
  }
  .mark {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border-radius: 18px;
    color: #fffaf2;
    font-size: 34px;
    background: #15161b;
    box-shadow: 0 20px 45px rgba(12, 15, 24, .16);
  }
  .brand span { font-size: 26px; }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 13px 18px;
    border-radius: 999px;
    font-size: 20px;
    font-weight: 780;
    color: #92324c;
    background: rgba(255,255,255,.72);
    border: 1px solid rgba(30, 31, 38, .08);
    box-shadow: 0 16px 45px rgba(35, 35, 42, .08);
  }
  .hero {
    display: grid;
    grid-template-columns: 0.86fr 1.14fr;
    gap: 40px;
    margin-top: 48px;
    align-items: stretch;
  }
  h1 {
    margin: 0;
    max-width: 610px;
    font-size: 78px;
    line-height: .96;
    letter-spacing: -.035em;
  }
  .sub {
    margin-top: 24px;
    max-width: 580px;
    color: #555761;
    font-size: 28px;
    line-height: 1.28;
    font-weight: 620;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 36px;
  }
  .chips span {
    padding: 12px 15px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid rgba(20,21,26,.09);
    box-shadow: 0 14px 30px rgba(20,21,26,.07);
    color: #2d3038;
    font-weight: 800;
    font-size: 18px;
  }
  .phone {
    position: relative;
    height: 745px;
    border-radius: 50px;
    padding: 24px;
    background: rgba(255,255,255,.66);
    border: 1px solid rgba(20,21,26,.10);
    box-shadow: 0 35px 95px rgba(34, 40, 54, .18);
    backdrop-filter: blur(20px);
  }
  .phone-inner {
    height: 100%;
    border-radius: 36px;
    padding: 26px;
    background: linear-gradient(180deg, #ffffff 0%, #f8f8fb 100%);
    border: 1px solid rgba(20,21,26,.08);
    overflow: hidden;
  }
  .chat-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 18px;
    border-bottom: 1px solid rgba(20,21,26,.09);
  }
  .person { display: flex; align-items: center; gap: 13px; }
  .avatar {
    width: 54px; height: 54px; border-radius: 18px;
    background: linear-gradient(135deg, #ff8aa8, #7aa7ff);
    box-shadow: inset 0 0 0 2px rgba(255,255,255,.7);
  }
  .person b { display:block; font-size: 22px; }
  .person small { display:block; margin-top: 2px; color:#6d707a; font-size: 15px; font-weight:700; }
  .live {
    color:#0b8f6a; background:#e7f8f2; padding:8px 12px; border-radius:999px; font-weight:900; font-size:14px;
  }
  .thread {
    display: grid;
    gap: 18px;
    padding-top: 24px;
  }
  .bubble {
    max-width: 82%;
    padding: 17px 19px;
    border-radius: 24px;
    font-size: 20px;
    line-height: 1.35;
    font-weight: 680;
  }
  .in { background:#f0f1f5; color:#272a32; border-top-left-radius:8px; }
  .out { justify-self:end; background:#15161b; color:#fffaf2; border-top-right-radius:8px; }
  .voice-card {
    margin-top: 4px;
    padding: 20px;
    border-radius: 30px;
    background: linear-gradient(135deg,#1a1b22,#2a2231);
    color: #fffaf2;
    box-shadow: 0 26px 70px rgba(10, 12, 20, .23);
  }
  .voice-title { display:flex; justify-content:space-between; align-items:center; font-weight:850; font-size:19px; }
  .wave { display:flex; align-items:center; gap:6px; height:116px; margin-top:18px; }
  .wave i { display:block; width:7px; border-radius:999px; background:linear-gradient(180deg,#ff8aa8,#ffd37d,#7aa7ff); opacity:.95; }
  .actions { display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:18px; }
  .actions span { padding:12px 10px; border-radius:16px; text-align:center; background:rgba(255,255,255,.10); color:#fff; font-weight:830; font-size:15px; }
  .sidecards {
    position: absolute;
    right: 46px;
    bottom: 52px;
    display: grid;
    grid-template-columns: repeat(3, 205px);
    gap: 14px;
  }
  .mini {
    min-height: 154px;
    padding: 18px;
    border-radius: 26px;
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(20,21,26,.08);
    box-shadow: 0 24px 55px rgba(34, 40, 54, .13);
  }
  .mini b { display:block; font-size:20px; line-height:1.05; }
  .mini p { margin:12px 0 0; color:#5d6069; font-size:15px; line-height:1.25; font-weight:680; }
  .mini:first-child { transform: rotate(-3deg); }
  .mini:nth-child(2) { transform: translateY(-16px); }
  .mini:nth-child(3) { transform: rotate(2deg); }
</style>
</head>
<body>
  <div class="frame">
    <div class="top">
      <div class="brand"><div class="mark">K</div><span>K.skill Voice Memory Studio</span></div>
      <div class="pill">Voice notes → Voice DNA → Reply Lab → Export</div>
    </div>
    <div class="hero">
      <section>
        <h1>声音，比文字更像那个人。</h1>
        <p class="sub">把语音消息、聊天、照片和记忆放进一个本地 pack。想念、梦中角色、虚拟人格、关系复盘，都可以从一段声音开始。</p>
        <div class="chips">
          <span>想念某人</span>
          <span>梦中角色</span>
          <span>语音回信</span>
          <span>怀念与纪念</span>
          <span>本地 voice engine</span>
        </div>
      </section>
      <section class="phone">
        <div class="phone-inner">
          <div class="chat-head">
            <div class="person"><div class="avatar"></div><div><b>Memory Voice</b><small>voice note · 0:18 · zh</small></div></div>
            <span class="live">ASR ready</span>
          </div>
          <div class="thread">
            <div class="bubble in">“今天路过那家店，突然想起你以前的笑声。”</div>
            <div class="bubble out">我想把这段声音留住，也想知道如果继续聊，可以怎么说。</div>
            <div class="voice-card">
              <div class="voice-title"><span>Persona Voice Preview</span><span>00:18</span></div>
              <div class="wave">${bars}</div>
              <div class="actions"><span>Transcribe</span><span>Clone</span><span>Speak</span></div>
            </div>
            <div class="bubble in">K.skill: 已整理 voice DNA、口头禅、停顿、情绪温度和三条可发回复。</div>
          </div>
        </div>
      </section>
    </div>
    <div class="sidecards">
      <div class="mini"><b>Crush Coach Voice</b><p>TA 发语音，也能分析热度、语气、窗口和下一句。</p></div>
      <div class="mini"><b>Relationship Memory</b><p>把声音、照片、聊天一起变成长期关系记忆。</p></div>
      <div class="mini"><b>Character Voice</b><p>动漫角色、电影人物、虚拟人格都有自己的声音 DNA。</p></div>
    </div>
  </div>
</body>
</html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: out, type: "png" });
await browser.close();

console.log(out);
