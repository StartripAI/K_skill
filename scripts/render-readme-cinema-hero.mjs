import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const out = resolve(root, "assets/readme/hero-voice-memory-cinema.png");
mkdirSync(dirname(out), { recursive: true });

const waveBars = Array.from({ length: 96 }, (_, index) => {
  const x = 250 + index * 11.2;
  const phase = Math.sin(index * 0.32) + Math.sin(index * 0.11 + 1.2);
  const h = 24 + Math.round(Math.abs(phase) * 62) + (index % 6) * 4;
  const y = 508 - h / 2 + Math.sin(index * 0.19) * 22;
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="5.8" height="${h}" rx="2.9" />`;
}).join("");

const shards = [
  { x: 148, y: 178, w: 222, h: 138, r: -8, title: "voice note", meta: "00:18" },
  { x: 1168, y: 134, w: 246, h: 156, r: 7, title: "dream role", meta: "voice DNA" },
  { x: 104, y: 638, w: 260, h: 164, r: 5, title: "memory", meta: "shared places" },
  { x: 1194, y: 650, w: 280, h: 176, r: -6, title: "persona", meta: "speak preview" },
  { x: 1018, y: 384, w: 210, h: 130, r: 9, title: "emotion", meta: "warmth" }
].map((card, index) => `
  <div class="shard shard-${index}" style="
    left:${card.x}px; top:${card.y}px; width:${card.w}px; height:${card.h}px; transform:rotate(${card.r}deg);
  ">
    <div class="shard-line"></div>
    <b>${card.title}</b>
    <span>${card.meta}</span>
  </div>
`).join("");

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
      radial-gradient(circle at 50% 46%, rgba(255, 213, 154, .30), transparent 19%),
      radial-gradient(circle at 47% 44%, rgba(113, 175, 255, .22), transparent 28%),
      radial-gradient(circle at 14% 18%, rgba(255, 119, 167, .15), transparent 28%),
      radial-gradient(circle at 86% 15%, rgba(103, 216, 204, .16), transparent 27%),
      linear-gradient(180deg, #0a0c14 0%, #111624 47%, #211b24 72%, #090b12 100%);
    color: #fff8ec;
  }
  .stage {
    position: relative;
    width: 1600px;
    height: 1000px;
    isolation: isolate;
  }
  .cinema-bars::before,
  .cinema-bars::after {
    content: "";
    position: absolute;
    left: 0;
    width: 100%;
    height: 74px;
    background: rgba(2, 3, 7, .72);
    z-index: 10;
  }
  .cinema-bars::before { top: 0; }
  .cinema-bars::after { bottom: 0; }
  .grain {
    position: absolute;
    inset: -2px;
    opacity: .13;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(255,255,255,.45) 0 1px, transparent 1.5px),
      radial-gradient(circle at 80% 40%, rgba(255,255,255,.30) 0 1px, transparent 1.5px);
    background-size: 38px 38px, 54px 54px;
    mix-blend-mode: overlay;
    z-index: 2;
  }
  .horizon {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 120px;
    height: 320px;
    background:
      radial-gradient(ellipse at center, rgba(255, 186, 111, .34), transparent 33%),
      linear-gradient(180deg, transparent, rgba(255, 166, 105, .10) 38%, rgba(0,0,0,.34));
    filter: blur(18px);
    z-index: 1;
  }
  .portal {
    position: absolute;
    left: 345px;
    top: 135px;
    width: 910px;
    height: 700px;
    border-radius: 50%;
    background:
      radial-gradient(ellipse at 50% 47%, rgba(255,255,255,.22), transparent 12%),
      radial-gradient(ellipse at 50% 49%, rgba(254, 206, 148, .21), transparent 27%),
      radial-gradient(ellipse at 50% 50%, rgba(105, 177, 255, .16), transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.08), transparent 62%);
    box-shadow:
      0 0 160px rgba(255, 199, 139, .20),
      inset 0 0 110px rgba(255,255,255,.10);
    filter: saturate(1.08);
    z-index: 3;
  }
  .portal::before,
  .portal::after {
    content: "";
    position: absolute;
    inset: 54px 94px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,.17);
    box-shadow: 0 0 70px rgba(128, 190, 255, .18);
  }
  .portal::after {
    inset: 118px 190px;
    border-color: rgba(255, 219, 172, .24);
    filter: blur(.2px);
  }
  .memory-beam {
    position: absolute;
    left: 522px;
    top: 76px;
    width: 560px;
    height: 855px;
    background: linear-gradient(90deg, transparent, rgba(255,244,222,.15), transparent);
    clip-path: polygon(38% 0, 62% 0, 82% 100%, 18% 100%);
    filter: blur(8px);
    z-index: 4;
  }
  .figure {
    position: absolute;
    left: 650px;
    top: 314px;
    width: 300px;
    height: 410px;
    z-index: 7;
    opacity: .95;
    filter: drop-shadow(0 44px 70px rgba(0,0,0,.62));
  }
  .figure::before {
    content: "";
    position: absolute;
    left: 97px;
    top: 0;
    width: 106px;
    height: 128px;
    border-radius: 48% 48% 44% 44%;
    background:
      radial-gradient(circle at 58% 30%, rgba(255,236,210,.52), transparent 20%),
      linear-gradient(180deg, rgba(42,45,58,.96), rgba(9,10,15,.98));
    box-shadow: inset 0 0 40px rgba(255,255,255,.05);
  }
  .figure::after {
    content: "";
    position: absolute;
    left: 28px;
    top: 120px;
    width: 244px;
    height: 290px;
    border-radius: 46% 46% 18% 18%;
    background:
      radial-gradient(ellipse at 50% 12%, rgba(255,230,194,.18), transparent 22%),
      linear-gradient(180deg, rgba(31,34,46,.96), rgba(7,8,12,1));
  }
  .wave-wrap {
    position: absolute;
    inset: 0;
    z-index: 8;
    pointer-events: none;
  }
  .wave {
    fill: url(#waveGradient);
    opacity: .90;
    filter: drop-shadow(0 0 18px rgba(255, 211, 143, .62)) drop-shadow(0 0 32px rgba(119, 188, 255, .34));
  }
  .sound-ring {
    position: absolute;
    left: 445px;
    top: 188px;
    width: 710px;
    height: 578px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,.19);
    transform: rotate(-8deg);
    box-shadow: 0 0 90px rgba(105, 181, 255, .12), inset 0 0 80px rgba(255,255,255,.06);
    z-index: 6;
  }
  .sound-ring.r2 {
    left: 375px;
    top: 130px;
    width: 850px;
    height: 690px;
    opacity: .55;
    transform: rotate(7deg);
  }
  .shard {
    position: absolute;
    padding: 22px 24px;
    border-radius: 28px;
    background:
      linear-gradient(135deg, rgba(255,255,255,.21), rgba(255,255,255,.07)),
      radial-gradient(circle at 12% 16%, rgba(255, 211, 153, .22), transparent 36%);
    border: 1px solid rgba(255,255,255,.18);
    box-shadow: 0 34px 86px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.22);
    backdrop-filter: blur(16px);
    z-index: 9;
    overflow: hidden;
  }
  .shard::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 68% 30%, rgba(129, 202, 255, .22), transparent 25%),
      linear-gradient(180deg, transparent, rgba(0,0,0,.18));
  }
  .shard-line {
    position: relative;
    width: 84px;
    height: 7px;
    margin-bottom: 24px;
    border-radius: 999px;
    background: linear-gradient(90deg, #ffd18a, #8cc8ff);
    box-shadow: 0 0 30px rgba(255, 209, 138, .48);
  }
  .shard b,
  .shard span {
    position: relative;
    display: block;
    letter-spacing: 0;
  }
  .shard b {
    font-size: 28px;
    line-height: 1;
    color: rgba(255, 250, 240, .95);
  }
  .shard span {
    margin-top: 13px;
    font-size: 17px;
    font-weight: 800;
    color: rgba(255, 244, 225, .66);
  }
  .brand {
    position: absolute;
    left: 82px;
    top: 102px;
    z-index: 12;
    display: flex;
    align-items: center;
    gap: 15px;
    color: rgba(255,250,242,.88);
    font-weight: 850;
    font-size: 24px;
    letter-spacing: 0;
  }
  .mark {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    background: rgba(255,255,255,.13);
    border: 1px solid rgba(255,255,255,.20);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.20), 0 18px 44px rgba(0,0,0,.28);
  }
  .caption {
    position: absolute;
    left: 82px;
    bottom: 112px;
    z-index: 12;
    max-width: 620px;
  }
  .caption h1 {
    margin: 0;
    font-size: 72px;
    line-height: .96;
    letter-spacing: -0.015em;
    text-shadow: 0 18px 60px rgba(0,0,0,.42);
  }
  .caption p {
    margin: 22px 0 0;
    font-size: 25px;
    line-height: 1.28;
    color: rgba(255, 239, 217, .76);
    font-weight: 650;
  }
  .orb {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.92), rgba(255,210,148,.50) 34%, rgba(111,174,255,.18) 68%, transparent 70%);
    filter: blur(.1px);
    box-shadow: 0 0 36px rgba(255,207,140,.32);
    z-index: 8;
  }
  .o1 { width: 26px; height: 26px; left: 514px; top: 334px; }
  .o2 { width: 15px; height: 15px; left: 1084px; top: 334px; }
  .o3 { width: 19px; height: 19px; left: 448px; top: 600px; }
  .o4 { width: 12px; height: 12px; left: 1155px; top: 568px; }
  .floor {
    position: absolute;
    left: 280px;
    right: 280px;
    bottom: 80px;
    height: 260px;
    background: radial-gradient(ellipse at center, rgba(255,199,139,.20), transparent 58%);
    filter: blur(18px);
    z-index: 5;
  }
</style>
</head>
<body>
  <main class="stage">
    <div class="cinema-bars"></div>
    <div class="grain"></div>
    <div class="horizon"></div>
    <div class="portal"></div>
    <div class="memory-beam"></div>
    <div class="sound-ring"></div>
    <div class="sound-ring r2"></div>
    <div class="floor"></div>
    <div class="figure"></div>
    <svg class="wave-wrap" width="1600" height="1000" viewBox="0 0 1600 1000" aria-hidden="true">
      <defs>
        <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7fc7ff" />
          <stop offset=".48" stop-color="#ffe1aa" />
          <stop offset="1" stop-color="#ff8fb3" />
        </linearGradient>
      </defs>
      <g class="wave">${waveBars}</g>
      <path d="M238 509 C 430 338, 562 678, 752 502 S 1094 327, 1330 506"
        fill="none" stroke="rgba(255,232,190,.68)" stroke-width="2" stroke-linecap="round" />
      <path d="M314 606 C 530 484, 690 736, 884 552 S 1138 472, 1280 610"
        fill="none" stroke="rgba(123,190,255,.26)" stroke-width="2" stroke-linecap="round" />
    </svg>
    ${shards}
    <div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div><div class="orb o4"></div>
    <div class="brand"><div class="mark">K</div><span>K.skill Voice Memory</span></div>
    <section class="caption">
      <h1>把一段声音，变成可以重逢的记忆。</h1>
      <p>voice notes, dreams, characters, relationship memory, and persona packs in one local studio.</p>
    </section>
  </main>
</body>
</html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: out, type: "png" });
await browser.close();

console.log(out);
