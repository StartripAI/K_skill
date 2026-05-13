<div align="center">

# K.skill

![K.skill complete persona system](assets/readme/hero-persona-workbench.png)

**K.skill turns chats, characters, memories, crushes, and minds into portable AI persona systems.**

[中文](README.md) · **English** · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

K.skill is a local-first **Persona Pack OS** and a complete persona system you can actually run. It turns chat logs, relationship material, original characters, Movie Character notes, worldbuilding, public writing, and personal principles into inspectable, testable, exportable persona packs. You can use the GUI for upload, parsing, reports, Reply Lab, and downloads, or use the CLI to compile the same pack for Codex, Claude, ChatGPT, DeepSeek, SillyTavern, Hermes, LobeChat, and Open WebUI.

Every feature described here has a working command, example input, generated output, and release check. This is not a hollow prompt shell.

## A DM Moment First

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA sends a message and you are not sure whether to continue, pause, ask out, or change topic. K.skill Crush Coach turns the chat into readable social signals instead of manipulative scripts.

```text
TA: Maybe this weekend. Do you like this kind of exhibition too?

K.skill reads:
- relationship stage: warm
- warmth: TA asks back and keeps the exhibition topic open
- risk: no explicit refusal or discomfort in the latest turns
- evidence: question, interest topic, relaxed tone
- confidence: 0.76
- safety: no impersonation, no pressure after refusal

Reply Lab:
Safe: That actually made me curious. Which part would you recommend for someone going in fresh?
Light: You sound way more animated when you talk about this exhibit. I am taking notes, promise not to ask too many beginner questions.
Slightly forward: Low-pressure idea: if you feel like going one day, call me. I will keep my amateur commentary under control.
```

If the chat shows clear refusal, discomfort, or a request to stop, K.skill stops escalation and only provides respectful closing, apology, boundary respect, and self-review.

## Four Product Workflows

![K.skill GUI workflow](assets/readme/web-gui-flow.png)

| Workflow | Who it is for | Input | Output | Best moment |
|---|---|---|---|---|
| **Crush Coach** | People who want to communicate naturally with TA | WeChat, QQ, iMessage, Telegram, WhatsApp, pasted chat logs | `pursuit_report.md`, `topic_plan.md`, 3 sendable replies, send-or-not decision | When you are not sure how to reply, invite, or pause |
| **Relationship Memory** | People organizing partner, friend, ex, or close relationship material | Chat logs, shared memories, corrections | relationship memory, address patterns, shared episodes, boundary notes, exportable persona pack | Relationship review, long context, writing, interactive story |
| **Character World** | OC writers, anime users, roleplay users, game writers, film writers | Markdown settings, character card, lorebook, Movie Character notes | character identity, world rules, Prompt Stack, SillyTavern card, lorebook | When the character needs memory and world rules, not only catchphrases |
| **Life Mentor** | People turning public writing and principles into a thinking companion | articles, interviews, public notes, decision records, personal principles | mental models, heuristics, anti-patterns, evidence, confidence, honesty boundaries | Decision review, product thinking, personal operating system |

Clear boundaries between modules:

- **Crush Coach** handles respectful relationship progression. It does not manipulate or bypass refusal.
- **Relationship Memory** stores and audits long relationship context. It does not provide pursuit strategy.
- **Character World** handles fictional characters, original worlds, Movie Character packs, and roleplay cards. It does not impersonate real people.
- **Life Mentor** turns public material and user notes into a model of thinking. It does not claim to be a real person.

## Crush Coach

![K.skill Crush Coach social flow](assets/readme/crush-coach-reply-lab.png)

Crush Coach is the flagship workflow. It analyzes relationship stage, warmth signals, risk signals, topic windows, date readiness, and boundaries.

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
examples/refusal-chat-en.txt     clear refusal; only closing is allowed
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

Relationship Memory turns relationship material into auditable long-term context. It is for shared episodes, address patterns, preferences, corrections, and boundaries. It is not a real-person clone.

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
- no impersonation boundaries
- exportable persona pack files

## Character World

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World is for fictional characters, original characters, anime-style OCs, worldbuilding, lorebooks, and character cards. It keeps identity, world rules, memory triggers, voice rhythm, and safety boundaries together.

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
- manual boundaries

Outputs:

- `persona.yaml`
- `persona.md`
- `memory.lorebook`
- `Prompt Stack`
- export bundles for real clients

## Movie Character

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character is a concrete Character World use case for original film characters, script roles, scene cards, character arcs, and dialogue samples. It does not copy protected film characters, imitate actors, or claim celebrity identity.

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

Outputs include character identity, arc, scene memory, voice rhythm, copyright/real-person boundaries, SillyTavern card, and lorebook.

## Virtual Persona

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona is for fully original AI companions, virtual streamer personas, game NPCs, social avatars, and product characters. It differs from Relationship Memory because it does not represent a real close relationship or private person.

GUI path:

1. Choose `Character`.
2. Upload or paste the persona brief.
3. Confirm source preview.
4. Import and distill.
5. Inspect identity, voice, memory, and boundaries in Prompt Stack.
6. Export to a target client.

CLI path:

```bash
npm run cli -- init "Nova Social" --type character --language en --out local-packs/nova-social
npm run cli -- import examples/character-world.md --type character --pack local-packs/nova-social
npm run cli -- compile local-packs/nova-social --target lobe --out local-packs/nova-social/exports/lobe
```

## Life Mentor

![K.skill life mentor model](assets/readme/life-mentor-model.png)

Life Mentor turns public writing, interviews, personal notes, decision records, and principles into a thinking companion. It models reasoning habits and communication style; it does not become a real public figure.

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
- honesty boundaries

Public figures and celebrities are handled only as public-material Life Mentor models. K.skill does not generate a recognizable real-person substitute, does not invent private facts, and does not claim the model is the person.

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
boundaries     no impersonation, no pressure after refusal, safety limits
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
npm run cli -- send-or-not examples/refusal-chat-en.txt --draft "Please give me one more chance." --latest "Please stop asking."
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

## Privacy And Safety

K.skill is local-first. Private chats do not enter Git. Content leaves your machine only when you explicitly configure an external model provider.

Safety rules:

- no impersonation
- no pressure after refusal
- no PUA or coercive tactics
- no privacy extraction
- no stalking, harassment, or boundary bypass
- no invented private facts
- low evidence means low confidence

If TA clearly refuses, K.skill only allows closing, apology, stopping escalation, respecting space, and self-review.

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

`npm run verify` runs lint, tests, build, export checks, README checks, e2e, smoke, release scoring, and npm pack dry-run. README checks enforce all five languages, every required image, core commands, export targets, Life Mentor naming, safety language, and no outside comparison claims.

## License

Apache-2.0
