# K.skill Usage

K.skill is a local-first Persona Pack OS for four complete workflows:

- **Crush Coach**: analyze chat logs, relationship stage, warmth/risk signals, boundaries, Reply Lab, topic plan, and send-or-not decisions.
- **Relationship Memory**: turn close relationship material into auditable memory, corrections, evidence, and exportable persona packs.
- **Character World**: build original characters, anime-style OCs, virtual personas, Movie Character packs, worlds, cards, and lorebooks.
- **Life Mentor**: distill public writing, notes, principles, and decision records into a grounded thinking companion with evidence and confidence.

## Start The GUI

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

Open the printed local URL, usually `http://127.0.0.1:5999`.

GUI flow:

1. Choose one workflow.
2. Enter pack name and language.
3. Upload files or paste text.
4. Confirm consent and privacy.
5. Read parse preview.
6. Run Crush Coach lab when using pursuit analysis.
7. Download reports and export zip bundles.

## CLI Recipes

Crush Coach:

```bash
npm run cli -- pursue examples/crush-chat-zh.txt --me 我 --ta TA --goal ask_out --out tmp/pursuit-zh
npm run cli -- reply examples/crush-chat-zh.txt --latest "周末可能去 你也喜欢这种吗？" --me 我 --ta TA --style natural
npm run cli -- topics examples/cold-chat-zh.txt --me 我 --ta TA
npm run cli -- send-or-not examples/refusal-chat-en.txt --draft "Please give me one more chance." --latest "Please stop asking."
```

Relationship Memory:

```bash
npm run cli -- init "Rain Bookstore Memory" --type relationship --language zh --out local-packs/rain-bookstore
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/rain-bookstore
npm run cli -- memory local-packs/rain-bookstore
npm run cli -- inspect local-packs/rain-bookstore
```

Character World:

```bash
npm run cli -- init "Rain Archive" --type character --language zh --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
npm run cli -- compile local-packs/rain-archive --target sillytavern
```

Movie Character:

```bash
npm run cli -- init "Mira Vale" --type character --language en --out local-packs/mira-vale
npm run cli -- import examples/movie-character.md --type character --pack local-packs/mira-vale
npm run cli -- export-zip local-packs/mira-vale --target chatgpt --out local-packs/mira-vale/exports/chatgpt.zip
```

Life Mentor:

```bash
npm run cli -- init "Decision Life Mentor" --type advisor --language en --out local-packs/decision-life-mentor
npm run cli -- import examples/life-mentor-source.md --type advisor --pack local-packs/decision-life-mentor
npm run cli -- distill local-packs/decision-life-mentor
npm run cli -- inspect local-packs/decision-life-mentor
```

## Export Targets

```bash
npm run cli -- compile local-packs/my-pack --target codex
npm run cli -- compile local-packs/my-pack --target claude
npm run cli -- compile local-packs/my-pack --target chatgpt
npm run cli -- compile local-packs/my-pack --target deepseek
npm run cli -- compile local-packs/my-pack --target sillytavern
npm run cli -- compile local-packs/my-pack --target hermes
npm run cli -- compile local-packs/my-pack --target lobe
npm run cli -- compile local-packs/my-pack --target openwebui
```

Generated artifacts:

- Codex / Claude: `SKILL.md` and `references/`.
- ChatGPT: `instructions.md`, `knowledge/`, `gpt-config.json`.
- DeepSeek: `system-prompt.json`, `api-request.json`.
- SillyTavern: `character-card-v2.json`, `lorebook.json`.
- Hermes: `SOUL.md`, `skills/`.
- LobeChat: `lobe-agent.json`.
- Open WebUI: `openwebui-agent.json`.

## Local API

```text
GET  /api/health
GET  /api/vault
GET  /api/packs
POST /api/packs
POST /api/imports
POST /api/packs/:id/pastes
GET  /api/packs/:id/sources
GET  /api/packs/:id/prompt-stack
POST /api/packs/:id/pursuit
GET  /api/packs/:id/reports
GET  /api/reports/:reportId/download
POST /api/packs/:id/exports
GET  /api/exports/:exportId/download
GET  /api/packs/:id/memory
PATCH /api/packs/:id/memory
```

## Safety

K.skill is local-first. Private chats do not enter Git. External model calls happen only when a user explicitly configures a provider.

Rules:

- no impersonation
- no pressure after refusal
- no coercive tactics
- no privacy extraction
- no stalking, harassment, or boundary bypass
- no invented private facts
- evidence and confidence must stay visible

## Verify

```bash
npm run lint
npm test
npm run build
npm run check:exports
npm run check:readme
npm run test:e2e
npm run smoke
npm run score:release
npm run verify
```
