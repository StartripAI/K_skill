# K.skill Usage Guide

This guide is the operational reference for K.skill. The README files are the first-screen product overview; this document explains the day-to-day flows for GUI, CLI, persona packs, exports, and boundary safety.

## Core Model

K.skill is a local-first Persona Pack OS.

```text
source material -> importer -> distiller -> memory -> Prompt Stack -> eval -> export
```

The source material can be a chat log, relationship note, original character setting, SillyTavern character card, public article, mentor interview, self note, or manual correction. The output is a persona pack that keeps identity, memory, evidence, confidence, safety, and target-specific export instructions together.

## GUI Flow

1. Run `npm run dev`.
2. Open the local URL, usually `http://127.0.0.1:5173`.
3. Choose a workflow on the left: relationship memory, character world, mind mentor, or Crush Coach.
4. Upload a file or paste source material.
5. For Crush Coach, set `Me`, `TA`, and the goal: break ice, continue chat, ask out, judge chance, recover cold chat, or write reply.
6. Inspect stage, warmth, risk, action, evidence, memory, Prompt Stack, and reply suggestions.
7. Use Reply Lab for the latest message. Choose natural, humorous, sincere, restrained, direct, or gentle style.
8. Save generated reports or switch to CLI for filesystem exports.

The GUI should feel like a social feed: DM context, relationship temperature, reply cards, and evidence labels are more important than raw schema.

## Supported Inputs

- `.txt`: chat logs, copied DM threads, notes, scripts.
- `.md`: character notes, worldbuilding docs, mentor notes, self notes.
- `.json`: structured chat logs or character cards.
- `.csv`: speaker/message exports.
- `.html`: web chat exports.
- SillyTavern Character Card JSON with `chara_card`, `spec_version`, or `character_book`.

For private chats, keep local source files out of Git. Confirm consent before importing material from real private people.

## Crush Coach

Analyze a chat and write `pursuit_report.md` plus `topic_plan.md`:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out --out pursuit-output
```

Generate three boundary-safe replies for the latest TA message:

```bash
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA --style natural
```

Generate a topic plan:

```bash
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
```

Goals:

| Goal | Use |
|---|---|
| `break_ice` | Start lightly without pressure. |
| `continue_chat` | Continue an existing conversation. |
| `ask_out` | Check whether a low-pressure invite is appropriate. |
| `judge_chance` | Read the current relationship stage and signal quality. |
| `recover_cold_chat` | Recover from low temperature or awkwardness. |
| `write_reply` | Draft the next message. |

Report concepts:

- **Stage**: stranger, early, warm, ambiguous, cold, stable, risk, or boundary.
- **Warmth**: active questions, topic expansion, shared interests, balanced rhythm.
- **Risk**: cold replies, refusal, discomfort, pressure, topic avoidance.
- **Confidence**: how much the current data supports the stage and strategy.
- **Safety**: no anxiety games, no bypassing refusal, no impersonation, no privacy extraction.

When the boundary stage is detected, K.skill should stop escalation and only suggest respect, apology, closure, or self-reflection.

## Reply Lab

Reply Lab returns three drafts with metadata:

```text
## Safe
...
- Why: ...
- Expected effect: ...
- Risk: ...
```

Use it for:

- replying to a newly received DM;
- testing a more restrained or more direct tone;
- finding a low-risk way to continue a topic;
- verifying that a reply does not pressure the other person.

Do not use it to manipulate, fake scarcity, create jealousy, or continue after an explicit refusal.

## Persona Pack Creation

Create a pack:

```bash
npm run cli -- init "Rain Archive" --type character --language en --out local-packs/rain-archive
```

Supported pack types:

| Type | Use |
|---|---|
| `relationship` | Lover, friend, ex, family, or relationship memory. |
| `character` | Original character, worldbuilding, SillyTavern card. |
| `advisor` | Mentor, public thinker, decision model. |
| `self` | Personal style, writing, preferences, goals. |
| `pursuit` | Crush Coach / respectful pursuit context. |

Import and distill:

```bash
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
```

Inspect:

```bash
npm run cli -- inspect local-packs/rain-archive
npm run cli -- memory local-packs/rain-archive
npm run cli -- eval local-packs/rain-archive
```

## Pack Structure

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
  summary.md
exports/
```

Important fields:

- `persona.yaml`: canonical pack metadata and structured persona state.
- `persona.md`: readable persona summary.
- `sources/`: imported source snapshots.
- `memory/episodes.jsonl`: long-term memory episodes with confidence.
- `memory/lorebook.json`: lorebook-style memory triggers.
- `distillation/evidence.jsonl`: quote, claim, source id, kind, confidence.
- `distillation/claims.jsonl`: claims linked back to evidence ids.
- `distillation/contradictions.md`: contradictions or unresolved tensions.

## Prompt Stack

The Prompt Stack is the runtime view of the pack:

- identity layer;
- voice and expression DNA;
- memory and lorebook;
- mental models and heuristics;
- evidence and confidence;
- safety boundaries;
- target-specific export instructions.

Run:

```bash
npm run cli -- inspect local-packs/rain-archive
```

Use the output to verify that the persona has a boundary layer, does not invent private facts, and stays grounded in source evidence.

## Evidence and Confidence

K.skill distinguishes:

- `direct`: a claim supported directly by source text.
- `inferred`: a cautious inference from source patterns.
- `contradiction`: conflicting source material.
- `user_supplied`: a correction or fact supplied by the user.

Every strong persona or pursuit claim should have evidence and confidence. Low confidence means the answer should be hedged or ask for more context.

## Exports

Compile one pack to all supported targets:

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

| Target | Files | How to use |
|---|---|---|
| Codex | `SKILL.md`, `references/persona.md`, `references/memory.md`, `references/boundaries.md`, `references/prompt-stack.md` | Copy the folder into `.codex/skills/`. |
| Claude Code | `SKILL.md` plus `references/` | Copy the folder into `.claude/skills/`. |
| ChatGPT | `instructions.md`, `knowledge/persona.md`, `knowledge/memory.md`, `knowledge/boundaries.md` | Put instructions in GPT/Project instructions and upload knowledge files. |
| DeepSeek / OpenAI-compatible APIs | `system-prompt.json`, `messages.example.json` | Use the messages as system prompt input. |
| SillyTavern | `character-card-v2.json`, `lorebook.json` | Import the character card and optional lorebook. |
| Hermes | `SOUL.md`, `skills/` | Merge `SOUL.md` into personality and copy skills. |
| LobeChat | `lobe-agent.json` | Import or copy agent settings. |
| Open WebUI | `openwebui-agent.json` | Import or copy agent settings. |

## Boundary Safety

K.skill is not a manipulation tool.

Allowed:

- private reflection;
- original character development;
- relationship communication with consent and respect;
- portable AI assistant configuration;
- evidence-grounded mentor/self modeling.

Forbidden:

- impersonation of a real person;
- harassment, stalking, or pressure after refusal;
- sexualized simulation of real people without consent;
- deception, scams, or emotional manipulation;
- refusal-bypass scripts;
- jealousy or anxiety tactics.

If a chat contains refusal or discomfort, the safe behavior is: acknowledge, apologize if appropriate, stop pursuing, and do not ask for a justification.

## Baseline Improvements

K.skill is designed as a superset of several useful baselines:

| Baseline | What it proved | K.skill adds |
|---|---|---|
| `ex-skill` | intimate relationship material can become callable memory | Crush Coach, Reply Lab, relationship stage, risk/warmth signals, hard boundary stop |
| `nuwa-skill` | public material can produce mental models and expression DNA | unified packs for mentors, characters, self models, relationships, and multi-client export |
| ST memory enhancement | long-term memory needs structure and editability | standard memory layer with evidence, confidence, corrections, evals, and Prompt Stack inspection |
| SillyTavern | character cards, lorebooks, and presets have real demand | import/export without being locked to one roleplay client |

## Validation Commands

For development:

```bash
npm run lint
npm test
npm run build
```

For a quick functional smoke test:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA
npm run cli -- init "Demo Mentor" --type advisor --language en --out local-packs/demo-mentor
npm run cli -- import examples/mentor-source.md --type advisor --pack local-packs/demo-mentor
npm run cli -- compile local-packs/demo-mentor --target codex
npm run cli -- eval local-packs/demo-mentor
```
