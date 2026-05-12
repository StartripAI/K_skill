# K.skill

![K.skill workbench](assets/hero-chat-workbench.svg)

**K.skill turns chats, characters, memories, and minds into portable AI persona systems.**

Languages: [中文](README.md) · **English** · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

## What It Does

K.skill is a local-first Persona Pack OS. It imports chat logs, character settings, public notes, relationship memories, and mentor materials, then turns them into inspectable persona packs that can be tested and exported.

Core workflows:

- Lover / relationship memory
- Anime, original character, and worldbuilding persona
- Mind mentor and mental model distillation
- **Crush Coach**: upload chat logs, analyze signals, generate respectful replies and topic plans

## Quick Start

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
```

Open the local URL, usually `http://127.0.0.1:5173`.

## Crush Coach

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out --out pursuit-output
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA --style natural
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
```

If the chat contains explicit refusal or discomfort, K.skill only suggests boundary-respecting closure or apology.

## Persona Pack

```bash
npm run cli -- init "Rain Archive" --type character --language en --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- inspect local-packs/rain-archive
npm run cli -- eval local-packs/rain-archive
```

## Exports

```bash
npm run cli -- compile local-packs/rain-archive --target codex
npm run cli -- compile local-packs/rain-archive --target claude
npm run cli -- compile local-packs/rain-archive --target chatgpt
npm run cli -- compile local-packs/rain-archive --target deepseek
npm run cli -- compile local-packs/rain-archive --target sillytavern
npm run cli -- compile local-packs/rain-archive --target hermes
npm run cli -- compile local-packs/rain-archive --target lobe
npm run cli -- compile local-packs/rain-archive --target openwebui
```

Use `SKILL.md` folders for Codex/Claude, `instructions.md` plus `knowledge/` for ChatGPT, `system-prompt.json` for DeepSeek/OpenAI-compatible APIs, Character Card V2 JSON for SillyTavern, `SOUL.md` for Hermes, and agent JSON for LobeChat/Open WebUI.

## Safety

K.skill is not a PUA tool. It does not provide manipulation, pressure, impersonation, stalking, or refusal-bypass tactics. Private data is local by default.
