<div align="center">

# K.skill

![K.skill social persona system](assets/hero-chat-workbench.svg)

**K.skill turns chats, characters, memories, crushes, and minds into portable AI persona systems.**

Languages: [中文](README.md) · **English** · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

<p align="center">
  <img src="assets/readme-dm-flow.svg" width="32%" alt="DM flow">
  <img src="assets/prompt-stack-social.svg" width="32%" alt="Prompt Stack inspector">
  <img src="assets/persona-export-matrix.svg" width="32%" alt="Export matrix">
</p>

## What K.skill Is

K.skill is a local-first **Persona Pack OS**. It imports chat logs, relationship material, original character notes, SillyTavern cards, public writing, and mentor/self notes, then turns them into inspectable, testable, exportable persona packs.

The product surface is intentionally social: stories, direct messages, reply cards, relationship temperature, confidence labels, and export buttons come before schema details.

```text
upload or paste material -> parse -> distill -> memory -> Prompt Stack -> eval -> export -> chat test
```

Use it for four core jobs:

- **Crush Coach**: understand chat signals and draft respectful replies.
- **Relationship memory**: preserve shared memories, address patterns, boundaries, and episodes.
- **Character/world persona**: compile OC settings, worldbuilding Markdown, and SillyTavern cards.
- **Mind mentor/self model**: distill expression DNA, mental models, heuristics, anti-patterns, and honesty boundaries.

## Quick Start

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
```

Open the local URL shown by Vite, usually `http://127.0.0.1:5173`.

CLI help:

```bash
npm run cli -- --help
```

Optional global local link:

```bash
npm link
kskill --help
```

## 5-Minute Crush Coach

Analyze a chat:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out --out pursuit-output
```

Generated files:

```text
pursuit-output/
  pursuit_report.md
  topic_plan.md
```

Draft three boundary-safe replies:

```bash
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA --style natural
```

Generate a topic plan:

```bash
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
```

Refusal scenario:

```bash
npm run cli -- pursue examples/refusal-chat-en.txt --me Me --ta TA --goal recover_cold_chat
```

If the other person refuses or expresses discomfort, K.skill only suggests respecting the boundary, apologizing briefly, closing, or self-reflection. It does not provide pressure tactics.

## Reply Lab

Reply Lab is the social-feed part of the system. It reads the latest message and the wider chat context, then returns three sendable drafts with:

- a label such as safe, playful, sincere, restrained, direct, or gentle;
- why the reply fits the current stage;
- expected effect;
- risk note;
- `boundarySafe: true`.

The goal is not to optimize control over another person. The goal is to express real intent with less ambiguity, less pressure, and more respect.

## Persona Pack Workflow

Create a pack:

```bash
npm run cli -- init "Rain Archive" --type character --language en --out local-packs/rain-archive
```

Import source material and distill:

```bash
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
```

Inspect the Prompt Stack and memory:

```bash
npm run cli -- inspect local-packs/rain-archive
npm run cli -- memory local-packs/rain-archive
npm run cli -- eval local-packs/rain-archive
```

Pack structure:

```text
persona.yaml
persona.md
sources/
memory/
  state.json
  episodes.jsonl
  lorebook.json
distillation/
  evidence.jsonl
  claims.jsonl
  contradictions.md
exports/
```

## Prompt Stack, Evidence, Confidence

K.skill treats persona behavior as a stack instead of a single prompt:

- **Identity**: role, voice, expression DNA, allowed uses.
- **Memory**: episodes, relationship facts, preferences, corrections, lorebook.
- **Mental models**: decisions, heuristics, anti-patterns, reasoning style.
- **Evidence**: quote, claim, source id, kind, confidence.
- **Safety**: no impersonation, no pressure after refusal, no invented private facts.
- **Export layer**: target-specific instructions for each client.

Every strong claim should point to source evidence and a confidence score. Thin evidence remains uncertainty; it is not promoted into fact.

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

| Target | Output |
|---|---|
| Codex | `SKILL.md` plus `references/` |
| Claude Code | `SKILL.md` plus `references/` |
| ChatGPT | `instructions.md` plus `knowledge/` |
| DeepSeek / OpenAI-compatible APIs | `system-prompt.json` and message examples |
| SillyTavern | Character Card V2 JSON and lorebook |
| Hermes | `SOUL.md` plus skill folder |
| LobeChat | agent JSON |
| Open WebUI | agent JSON |

## Baseline Improvements

K.skill starts from the lessons of adjacent projects and raises the baseline:

| Area | Existing baseline | K.skill improvement |
|---|---|---|
| `ex-skill` relationship memory | shared episodes, tone, intimate memory | relationship stage, warmth/risk signals, Reply Lab, boundary-first Crush Coach |
| `nuwa-skill` mind distillation | mental models, expression DNA, honesty boundaries | same pack format for mentors, characters, self, partners, and exports |
| ST memory enhancement | structured long-term memory | standard persona memory with evidence, confidence, corrections, evals, and Prompt Stack inspection |
| SillyTavern ecosystem | mature character cards and lorebooks | not locked to one client; exports to Codex, Claude, ChatGPT, DeepSeek, SillyTavern, Hermes, LobeChat, Open WebUI |

## Boundary Safety

- Local-first by default.
- Private chat logs should not be committed; generated local packs and output folders are ignored.
- No PUA, jealousy games, pressure, refusal bypass, stalking, or impersonation.
- Do not simulate a real private person without consent.
- If refusal or discomfort appears, stop escalation.
- Before exporting to third-party tools, confirm you have the right to use the source material.

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

Smoke test:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA
npm run cli -- init "Demo Mentor" --type advisor --language en --out local-packs/demo-mentor
npm run cli -- import examples/mentor-source.md --type advisor --pack local-packs/demo-mentor
npm run cli -- compile local-packs/demo-mentor --target codex
npm run cli -- eval local-packs/demo-mentor
```

## License

MIT
