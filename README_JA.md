# K.skill

![K.skill workbench](assets/hero-chat-workbench.svg)

**K.skill はチャット、キャラクター、記憶、思考モデルを持ち運べる AI ペルソナシステムに変換します。**

言語: [中文](README.md) · [English](README_EN.md) · **日本語** · [한국어](README_KO.md) · [Español](README_ES.md)

## できること

- 恋人 / 関係記憶
- アニメ風ではなく、オリジナルキャラクター / 世界観のペルソナ化
- メンター / 思考モデルの蒸留
- **好きな人への返信コーチ**: チャットログを読み、温度感、リスク、話題、返信案を出します

## クイックスタート

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
```

通常は `http://127.0.0.1:5173` を開きます。

## CLI

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA
npm run cli -- init "Rain Archive" --type character --language ja --out local-packs/rain-archive
npm run cli -- compile local-packs/rain-archive --target chatgpt
```

## 安全

K.skill は操作、PUA、拒否の無視、なりすまし、ストーキングを支援しません。相手が拒否した場合は、尊重、謝罪、終了だけを提案します。
