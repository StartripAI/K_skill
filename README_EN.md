<div align="center">

# K.skill

![K.skill film voice memory hero](assets/readme/hero-voice-memory-film-v3.png)

**Turn someone's voice, chats, photos, stickers, and shared moments into a persona pack you can open again.**<br>
**把一个人的声音、聊天、照片、表情和共同经历，整理成可以继续打开的 persona pack。**

[中文](README.md) · **English** · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

Some people, relationships, and characters cannot be captured by a short prompt. A voice note has pauses. A chat has private jokes. A photo or sticker can carry the mood better than a paragraph. Shared history often lives across screenshots, notes, PDFs, transcripts, and half-remembered moments.

K.skill gathers that material into a local persona pack you can reopen. The pack keeps evidence, voice, relationship rhythm, character rules, and the Prompt Stack together, so you are not left with a flat summary. You can see what it remembers, hear the trace of the voice, and keep talking from there.

## Voice Memory: Put The Voice Into The Persona

![K.skill voice memory scene](assets/readme/voice-memory-anime-v3.png)

What stays with us is often not just the sentence, but how it sounded.<br>
A pause, a laugh, a catchphrase, a reply that arrives half a beat late, or a softer ending can bring someone back faster than a clean summary. Fictional characters work the same way: once the voice rhythm lands, the character stops feeling like a form and starts feeling present.

K.skill puts Voice Memory at the front of the experience. Audio becomes an inspectable transcript first, then turns into voice DNA, chat rhythm, relationship memory, character tone, and exportable persona files. You can start from one voice note, or mix voice with chats, images, stickers, PDFs, and video transcripts so the persona pack keeps both facts and feeling.

| Moment | What you add | What K.skill builds |
|---|---|---|
| Keeping someone close enough to revisit | voice notes, old chats, photos, shared moments | voice DNA, relationship memory, chat rhythm, a persona pack you can reopen |
| Shaping a character from your head | a description, character image, line audio, world notes | an original character with a voice feel, dialogue rhythm, and room to grow |
| Rebuilding a relationship timeline | old voice clips, screenshots, timeline, memory notes | Relationship Memory you can read, hear, revisit, and export |
| TA sends a voice note | TA voice note, recent chat, your goal | ASR transcript, tone read, warmth signals, 3 reply drafts you can edit |
| Movie / Virtual Character | character art, dialogue, voice material, scene cards | voice profile, visual style, sticker intents, full export bundle |

Start with the built-in samples, then connect your own local voice engine:

```bash
npm run cli -- transcribe tests/fixtures/media/voice-note-en.wav --provider stub-asr --language en --out tmp/transcript.json
npm run cli -- import tests/fixtures/media/voice-note-en.wav --type pursuit --media --provider stub-asr --pack local-packs/voice-crush
npm run cli -- speak local-packs/voice-crush --text "Keep it light and natural." --provider stub-tts --out tmp/voice-preview.wav

KSKILL_LOCAL_TTS_COMMAND="node examples/local-voice-engine.mjs" \
  npm run cli -- speak local-packs/voice-crush \
  --text "I still remember how you said that." \
  --provider local-voice-clone \
  --reference-audio tests/fixtures/media/voice-note-en.wav \
  --out tmp/memory-voice.wav
```

`local-voice-clone` has a clean boundary: K.skill sends `text`, `voice`, `language`, `referenceAudioPath`, `voiceProfilePath`, and `outFile` to your local voice engine through stdin JSON; your engine writes the audio; K.skill brings it back into GUI, CLI, and exports. Voice enters the experience, and the evidence trail stays visible.

## Six Scenes First

![K.skill six social persona scenes](assets/readme/persona-scenes-social-v3.png)

K.skill is not an empty chat box. It is a local memory space you can reopen when a message needs a reply, a relationship needs context, a character needs a world, or a set of public ideas needs to become something you can question.

| Scene | What you upload | What K.skill gives back |
|---|---|---|
| Crush Coach | Your chat with TA | chat rhythm, warmth signals, risk signals, next move, 3 replies you can edit |
| Relationship Memory | chat logs, shared memories, voice notes, corrections | a long-context relationship memory pack you can keep updating |
| Anime Character | OC sheets, world notes, dialogue samples | character identity, voice rhythm, lorebook, chat-ready pack |
| Movie Character | script fragments, scene cards, character biography | a virtual film character with arc, scene memory, and dialogue texture |
| Virtual Persona | AI companion brief, avatar notes, NPC design | a stable original persona for chat, streaming, games, or product roles |
| Public-Figure Life Mentor | articles, interviews, launches, notes | a public-material thinking model you can question |

For example, public founder material can become a Life Mentor for product judgment, writing, tradeoffs, launch thinking, and decision review. You can ask follow-up questions and still see the source trail, evidence, and confidence behind the answers.

## A DM Moment First

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA sends a message and you are stuck between replying, waiting, inviting, or changing topic. Crush Coach reads the temperature already present in the chat and gives you replies that should still sound like you.

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

When the vibe cools down, K.skill helps you close cleanly, pause, or return later with a lighter topic. When the window is still open, it helps you place the next sentence where it feels easy to answer.

## Four Ways In

In practice, choose the kind of memory you are trying to reopen: the message in front of you, a long relationship, a character world, or a set of public ideas. Voice Memory is the voice layer that can sit on top of each path.

| Path | What it holds | How it opens |
|---|---|---|
| **Voice Memory** | ASR, transcript evidence, voice DNA, TTS preview, voice material inside the persona pack | Add it to any workflow, or use it alone to create a voice profile |
| **Crush Coach** | reply writing, timing, warmth signals, risk signals, chat rhythm | Read evidence, confidence, and reply options; edit the one that feels most like you |
| **Relationship Memory** | partner, friend, ex, and close-relationship context | Treat it like a living relationship album you can correct and extend |
| **Character World** | anime OCs, fictional roles, Movie Character packs, lorebooks, NPCs, virtual personas | Keep identity, world rules, memory triggers, and voice rhythm together |
| **Life Mentor** | public writing, interviews, decision notes, principles, personal operating ideas | Question the source trail, mental models, evidence, and confidence |

## Voice Studio

Real material rarely arrives as a perfect document. Chats come with screenshots, voice notes, photos, stickers, emoji reactions, PDFs, and video transcript sidecars. Voice Studio gives all of that one door.

The pipeline runs **multimodal import** first: text becomes chat turns, audio goes through **ASR** into transcript evidence, image / screenshot / PDF / video transcript material becomes media evidence, and stickers become **sticker intents**. Crush Coach, Relationship Memory, Character World, and Life Mentor can all use that same evidence trail.

CLI:

```bash
npm run cli -- transcribe tests/fixtures/media/voice-note-en.wav --provider stub-asr --language en --out tmp/transcript.json
npm run cli -- import tests/fixtures/media/voice-note-en.wav --type pursuit --media --provider stub-asr --pack local-packs/voice-crush
npm run cli -- speak local-packs/voice-crush --text "Keep it light and natural." --provider stub-tts --out tmp/voice-preview.wav
npm run cli -- voice-profile local-packs/voice-crush
```

GUI:

1. In `DM intake`, choose `Files / Paste / Record / Media`.
2. Upload a chat log, voice note, screenshot, sticker, PDF, video transcript, or ZIP bundle.
3. Use `Record` to capture a short voice note and fill Reply Lab after ASR.
4. `Parse preview` shows messages, assets, transcripts, reactions, and attachment kinds.
5. `Persona Voice` keeps voice DNA, TTS preview, visual style, and sticker intents inside the export.

The boundary is simple:

- **Voice Memory** keeps voice, transcript, voice DNA, and TTS preview inside the pack.
- **Crush Coach** reads chat rhythm and helps the next message feel natural.
- **Relationship Memory** turns shared context into long-term memory.
- **Character World** turns identity, world rules, memory, and tone into an interactive persona.
- **Life Mentor** turns public material and notes into a thinking companion you can question.

## Crush Coach

Crush Coach is the place to start when a message is waiting and you want the next reply to feel natural. It reads relationship stage, warmth signals, risk signals, topic windows, date readiness, and chat rhythm, then turns that into a pursuit report and a few replies you can actually edit.

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

Every strong claim carries `evidence` and `confidence`. When the signal is light, the report keeps that uncertainty visible so you can choose the tone yourself.

## Relationship Memory

![K.skill relationship memory](assets/readme/relationship-memory-chat.png)

Relationship Memory turns relationship material into auditable long-term context. Think of it as a relationship album that can hold more than photos: address patterns, voice notes, shared episodes, preferences, corrections, and the small details that make the connection specific.

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
- tone, rhythm, and memory notes
- exportable persona pack files

## Character World

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World is for fictional characters, original characters, anime-style OCs, worldbuilding, lorebooks, NPCs, virtual personas, and character cards. It keeps identity, world rules, memory triggers, and voice rhythm together so the character does not fall apart after one good opening line.

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
- character card JSON
- lorebook entries
- manual tone notes

Outputs:

- `persona.yaml`
- `persona.md`
- `memory.lorebook`
- `Prompt Stack`
- export bundles for supported persona formats

## Movie Character

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character is a concrete Character World use case for film-style characters, script roles, scene cards, character arcs, and dialogue samples. Think of it as the chat version of a film character bible: not only lines, but choices, scene memory, relationship tension, and voice rhythm.

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

Outputs include character identity, arc, scene memory, voice rhythm, source notes, character card, and lorebook.

## Virtual Persona

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona is for AI companions, virtual streamer personas, game NPCs, social avatars, and product characters built from your own brief. It gives an original persona a stable name, tone, memory shape, and export path before it enters a chat client.

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

Life Mentor turns public writing, interviews, personal notes, decision records, and principles into a thinking companion. It feels less like a static summary and more like a desk-side shelf of reasoning: ask how a decision would be framed, what risk is easy to miss, which principle applies, or where the source material disagrees with itself.

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

Public figures and celebrities fit public-material Life Mentor packs well: collect interviews, articles, launches, talks, and notes, then ask about product judgment, writing, choices, and tradeoffs while keeping the source trail visible.

## Persona Pack Anatomy

A persona pack is the core artifact. It is a portable folder for identity, memory, sources, distillation runs, and target-specific exports.

```text
persona.yaml          structured persona pack
persona.md            readable persona description
sources/              imported material
memory/               episodes, corrections, lorebook
distillation/         evidence, claims, contradictions, runs
exports/              target-specific files
```

Prompt Stack layers show why the persona speaks the way it does, what it remembers, and which material supports its stronger claims:

```text
identity       role, voice, expression DNA
mental_models  Life Mentor or character reasoning models
memory         profile facts, relationship facts, episodes
rhythm         relationship pacing, tone, reply feel, conversation texture
export layer   target platform format
```

## GUI Usage

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
GET  /api/voice/providers
POST /api/voice/asr
POST /api/voice/tts
POST /api/packs/:id/pastes
POST /api/packs/:id/pursuit
POST /api/packs/:id/replies
GET  /api/reports/:reportId/download
POST /api/packs/:id/exports
GET  /api/exports/:exportId/download
GET  /api/packs/:id/assets
GET  /api/packs/:id/assets/:assetId/download
GET  /api/packs/:id/memory
PATCH /api/packs/:id/memory
```

## CLI Usage

Use the CLI when you want the same persona pack flow inside scripts: initialize, import, distill, inspect, evaluate, and export.

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

A persona pack should not be trapped in one interface. K.skill converts the same identity, memory, evidence, and Prompt Stack into formats real clients can use.

| Target | Files | How to use |
|---|---|---|
| Skill folder | `SKILL.md`, `references/persona.md`, `references/memory.md`, `references/evidence.json` | Place the exported folder in your local skills path |
| Instruction bundle | `instructions.md`, `knowledge/`, config JSON | Use as chat persona instructions and knowledge files |
| API context | `system-prompt.json`, `api-request.json` | Use as system context or a request template |
| Character card | character card JSON, lorebook JSON | Import into environments that support cards and lorebooks |
| Soul archive | `SOUL.md`, `skills/` | Use `SOUL.md` as the primary identity file |
| Agent JSON | agent / model JSON | Import into local or self-hosted environments that accept JSON config |

Validate exports:

```bash
npm run check:exports
```

## Privacy And Feel

K.skill is local-first. Private chats stay outside the repository. Content leaves your machine only when you explicitly configure an external model provider. You can run the full sample flow with stub ASR / stub TTS before connecting your own voice or model service.

The feel is closer to keeping a relationship, character, or thinking archive open over time than asking a one-off question. You open it when you want to:

- read the vibe of a chat
- keep relationship memory in one place
- let an original character find a voice
- turn public material into a Life Mentor
- carry the same persona pack into common formats
- keep evidence and confidence visible

## Development And Verification

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

`npm run verify` runs the fixed local quality chain shown above, including build, exports, README checks, e2e, smoke, scoring, and a package dry-run. README checks enforce all five languages, every required image, core commands, export targets, Life Mentor naming, product concepts, and K.skill-only positioning.

## License

Apache-2.0
