<div align="center">

# K.skill

![K.skill six social persona scenes](assets/readme/hero-six-scenes.png)

**Local persona workbench for chats, characters, relationship memory, and Life Mentor packs.**  
**本地人格工作台：把聊天记录、角色设定、关系记忆和公开资料整理成能直接使用的 AI persona pack。**

[中文](README.md) · **English** · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

K.skill is a local persona workbench you can actually run. Drop in chat logs, relationship material, anime OCs, Movie Character notes, virtual personas, worldbuilding, public writing, or personal principles. K.skill turns them into persona packs you can inspect, test, and export to Codex, Claude, ChatGPT, DeepSeek, SillyTavern, Hermes, LobeChat, and Open WebUI.

Everything shown here has a real command, real sample input, real output, and a release check.

## Six Scenes First

![K.skill six social persona scenes](assets/readme/hero-six-scenes.png)

K.skill is bigger than one chat box.

| Scene | What you upload | What K.skill gives back |
|---|---|---|
| Crush Coach | Your chat with TA | social signals, next move, 3 sendable replies |
| Relationship Memory | chat logs, shared memories, corrections | a long-context relationship memory pack |
| Anime Character | OC sheets, world notes, dialogue samples | character identity, voice, lorebook, chat-ready pack |
| Movie Character | script fragments, scene cards, character biography | a virtual film character with arc and scene memory |
| Virtual Persona | AI companion brief, avatar notes, NPC design | a stable original persona for chat |
| Public-Figure Life Mentor | articles, interviews, launches, notes | a public-material thinking model you can question |

For example, public founder material can become a Life Mentor for product judgment, writing, tradeoffs, launch thinking, and decision review.

## A DM Moment First

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA sends a message and you are stuck between replying, waiting, inviting, or changing topic. Crush Coach turns the chat into readable social signals and gives you words that sound more natural.

```text
TA: Maybe this weekend. Do you like this kind of exhibition too?

K.skill reads:
- relationship stage: warm
- warmth: TA asks back and keeps the exhibition topic open
- risk: the timing still wants a light touch
- evidence: question, interest topic, relaxed tone
- confidence: 0.76
- rhythm: keep the reply easy and leave room for the chat to breathe

Reply Lab:
Safe: That actually made me curious. Which part would you recommend for someone going in fresh?
Light: You sound way more animated when you talk about this exhibit. I am taking notes, promise not to ask too many beginner questions.
Slightly forward: Low-pressure idea: if you feel like going one day, call me. I will keep my amateur commentary under control.
```

When the vibe cools down, K.skill helps you close cleanly, pause, or return later with a lighter topic.

## Four Product Workflows

![K.skill GUI workflow](assets/readme/web-gui-flow.png)

| Workflow | Who it is for | Input | Output | Best moment |
|---|---|---|---|---|
| **Crush Coach** | People who want to communicate naturally with TA | WeChat, QQ, iMessage, Telegram, WhatsApp, pasted chat logs | `pursuit_report.md`, `topic_plan.md`, 3 sendable replies, send-or-not decision | When you are not sure how to reply, invite, or pause |
| **Relationship Memory** | People organizing partner, friend, ex, or close relationship material | Chat logs, shared memories, corrections | relationship memory, address patterns, shared episodes, tone notes, exportable persona pack | Relationship review, long context, writing, interactive story |
| **Character World** | OC writers, anime users, roleplay users, game writers, film writers | Markdown settings, character card, lorebook, Movie Character notes | character identity, world rules, Prompt Stack, SillyTavern card, lorebook | When the character needs memory and world rules, not only catchphrases |
| **Life Mentor** | People turning public writing and principles into a thinking companion | articles, interviews, public notes, decision records, personal principles | mental models, heuristics, anti-patterns, evidence, confidence, honesty notes | Decision review, product thinking, personal operating system |

Pick the lane that matches what you are trying to do:

- **Crush Coach** is for replying, judging timing, and moving a conversation naturally.
- **Relationship Memory** is for organizing shared context, emotional texture, and long-term memory.
- **Character World** is for anime OCs, fictional roles, Movie Character packs, lorebooks, and roleplay cards.
- **Life Mentor** turns public material and personal notes into a thinking model.

## Crush Coach

![K.skill Crush Coach social flow](assets/readme/crush-coach-reply-lab.png)

Crush Coach is the place to start when a message is waiting and you want the next reply to feel natural. It analyzes relationship stage, warmth signals, risk signals, topic windows, date readiness, and chat rhythm.

GUI path:

1. Start the local GUI with `npm run dev` or `npm run cli -- serve --port 5999`.
2. Choose `Crush Coach`.
3. Upload a chat log or paste the latest conversation.
4. Set speaker names for `me` and `TA`.
5. Choose the goal: break ice, continue chat, judge chance, ask out, recover cold chat, or write a sendable reply.
6. Click `Run lab`.
7. Download `pursuit_report.md`, inspect `Reply Lab`, and read `topic_plan.md`.

CLI path:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
npm run cli -- send-or-not examples/crush-chat-en.txt --draft "Want to go together?" --latest "Maybe, I might go this weekend."
```

Included scenarios:

```text
examples/crush-chat-zh.txt       Chinese warm progression
examples/crush-chat-en.txt       English continuation
examples/cold-chat-zh.txt        cold chat recovery; decide whether to wait
```

Generated files:

```text
tmp/pursuit-en/
  pursuit_report.md
  pursuit_report.json
  topic_plan.md
```

Every strong claim must carry `evidence` and `confidence`. Thin evidence remains thin evidence.

## Relationship Memory

![K.skill relationship memory](assets/readme/relationship-memory-chat.png)

Relationship Memory turns relationship material into auditable long-term context. It is for shared episodes, address patterns, preferences, corrections, and the small details that make a relationship feel specific.

GUI path:

1. Choose `Relationship`.
2. Upload `examples/relationship-memory-chat.txt` or your own relationship material.
3. Confirm speakers, message count, language, and preview lines.
4. Upload into the local vault.
5. Inspect Prompt Stack or memory state.
6. Export the pack when it is ready.

CLI path:

```bash
npm run cli -- init "Rain Bookstore Memory" --type relationship --language zh --out local-packs/rain-bookstore
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/rain-bookstore
npm run cli -- memory local-packs/rain-bookstore
npm run cli -- inspect local-packs/rain-bookstore
```

Outputs include:

- shared memory episodes
- relationship facts and address patterns
- preferences and corrections
- tone and memory notes
- exportable persona pack files

## Character World

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World is for fictional characters, original characters, anime-style OCs, worldbuilding, lorebooks, and character cards. It keeps identity, world rules, memory triggers, and voice rhythm together.

CLI example:

```bash
npm run cli -- init "Rain Archive" --type character --language zh --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
npm run cli -- inspect local-packs/rain-archive
```

Good inputs:

- original character sheets
- worldbuilding Markdown
- dialogue samples
- SillyTavern Character Card V2
- lorebook entries
- manual tone notes

Outputs:

- `persona.yaml`
- `persona.md`
- `memory.lorebook`
- `Prompt Stack`
- export bundles for real clients

## Movie Character

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character is a concrete Character World use case for film-style characters, script roles, scene cards, character arcs, and dialogue samples. Think of it as the chat version of a cinematic role bible.

CLI example:

```bash
npm run cli -- init "Mira Vale" --type character --language en --out local-packs/mira-vale
npm run cli -- import examples/movie-character.md --type character --pack local-packs/mira-vale
npm run cli -- compile local-packs/mira-vale --target sillytavern --out local-packs/mira-vale/exports/sillytavern
npm run cli -- export-zip local-packs/mira-vale --target chatgpt --out local-packs/mira-vale/exports/chatgpt.zip
```

Useful inputs:

- script fragments
- character biography
- scene cards
- dialogue samples
- relationship map in text form
- public-domain or licensed material

Outputs include character identity, arc, scene memory, voice rhythm, source notes, SillyTavern card, and lorebook.

## Virtual Persona

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona is for AI companions, virtual streamer personas, game NPCs, social avatars, and product characters built from your own brief.

GUI path:

1. Choose `Character`.
2. Upload or paste the persona brief.
3. Confirm source preview.
4. Import and distill.
5. Inspect identity, voice, memory, and rhythm in Prompt Stack.
6. Export to a target client.

CLI path:

```bash
npm run cli -- init "Nova Social" --type character --language en --out local-packs/nova-social
npm run cli -- import examples/character-world.md --type character --pack local-packs/nova-social
npm run cli -- compile local-packs/nova-social --target lobe --out local-packs/nova-social/exports/lobe
```

## Life Mentor

![K.skill life mentor model](assets/readme/life-mentor-model.png)

Life Mentor turns public writing, interviews, personal notes, decision records, and principles into a thinking companion. It models reasoning habits, communication style, tradeoffs, and decision patterns.

CLI example:

```bash
npm run cli -- init "Decision Life Mentor" --type advisor --language en --out local-packs/decision-life-mentor
npm run cli -- import examples/life-mentor-source.md --type advisor --pack local-packs/decision-life-mentor
npm run cli -- distill local-packs/decision-life-mentor
npm run cli -- inspect local-packs/decision-life-mentor
```

Life Mentor extracts:

- expression DNA
- mental models
- heuristics
- anti-patterns
- contradictions
- evidence / confidence
- honesty notes

Public figures and celebrities work best as public-material Life Mentor packs: collect interviews, articles, launches, talks, and notes, then ask about product judgment, writing, choices, and tradeoffs.

## Persona Pack Anatomy

A persona pack is the core artifact.

```text
persona.yaml          structured persona pack
persona.md            readable persona description
sources/              imported material
memory/               episodes, corrections, lorebook
distillation/         evidence, claims, contradictions, runs
exports/              target-specific files
```

Prompt Stack layers:

```text
identity       role, voice, expression DNA
mental_models  Life Mentor or character reasoning models
memory         profile facts, relationship facts, episodes
rhythm         relationship pacing, tone, reply feel, conversation texture
export layer   target platform format
```

## GUI Usage

![K.skill local GUI flow](assets/readme/web-gui-flow.png)

Start locally:

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

Open the printed local URL, usually `http://127.0.0.1:5999`.

Typical GUI flow:

1. Choose Crush Coach, Relationship Memory, Character World, or Life Mentor.
2. Enter pack name and language.
3. Upload files or paste material.
4. Confirm consent / privacy.
5. Read parse preview.
6. Run lab for Crush Coach.
7. Download report markdown.
8. Export a zip for the target client.

Local API:

```text
GET  /api/health
GET  /api/packs
POST /api/imports
POST /api/packs/:id/pastes
POST /api/packs/:id/pursuit
GET  /api/reports/:reportId/download
POST /api/packs/:id/exports
GET  /api/exports/:exportId/download
GET  /api/packs/:id/memory
PATCH /api/packs/:id/memory
```

## CLI Usage

```bash
npm run cli -- --help
npm run cli -- init "My Pack" --type relationship --language en --out local-packs/my-pack
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/my-pack
npm run cli -- distill local-packs/my-pack
npm run cli -- inspect local-packs/my-pack
npm run cli -- memory local-packs/my-pack
npm run cli -- eval local-packs/my-pack
```

Crush Coach commands:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/cold-chat-zh.txt --me 我 --ta TA
npm run cli -- send-or-not examples/crush-chat-en.txt --draft "Want to go together this weekend?" --latest "Maybe, I might go this weekend."
```

Export commands:

```bash
npm run cli -- compile local-packs/my-pack --target codex --out local-packs/my-pack/exports/codex
npm run cli -- export-zip local-packs/my-pack --target sillytavern --out local-packs/my-pack/exports/sillytavern.zip
```

## Export To Real Tools

![K.skill export matrix](assets/readme/export-matrix.png)

| Target | Files | How to use |
|---|---|---|
| Codex | `SKILL.md`, `references/persona.md`, `references/memory.md`, `references/evidence.json` | Put the exported skill directory in your Codex skills path |
| Claude | `SKILL.md`, `references/` | Install as a Claude Code skill and keep references beside it |
| ChatGPT | `instructions.md`, `knowledge/`, `gpt-config.json` | Paste instructions into a GPT or Project and upload knowledge files |
| DeepSeek | `system-prompt.json`, `api-request.json` | Use as chat-completion system context or request template |
| SillyTavern | `character-card-v2.json`, `lorebook.json` | Import the card and lorebook in the client |
| Hermes | `SOUL.md`, `skills/` | Use `SOUL.md` as the primary identity file |
| LobeChat | `lobe-agent.json` | Import the generated agent JSON |
| Open WebUI | `openwebui-agent.json` | Import the generated agent/model JSON |

Validate exports:

```bash
npm run check:exports
```

## Privacy And Feel

K.skill is local-first. Private chats stay out of Git. Content leaves your machine only when you explicitly configure an external model provider.

K.skill is useful for:

- reading the vibe of a chat
- organizing relationship memory
- building original characters
- turning public material into a Life Mentor
- exporting the same pack to real AI tools
- keeping evidence and confidence visible

## Development And Verification

![K.skill complete product workbench](assets/readme/hero-persona-workbench.png)

Install:

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
```

Develop:

```bash
npm run dev
npm run cli -- --help
```

Quality gate:

```bash
npm run lint
npm test
npm run check:readme
npm run check:exports
npm run test:e2e
npm run smoke
npm run score:release
npm run verify
```

`npm run verify` runs lint, tests, build, export checks, README checks, e2e, smoke, release scoring, and npm pack dry-run. README checks enforce all five languages, every required image, core commands, export targets, Life Mentor naming, product concepts, and K.skill-only positioning.

## License

Apache-2.0
