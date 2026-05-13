<div align="center">

# K.skill

![K.skill complete persona system](assets/readme/hero-persona-workbench.png)

**K.skill turns chats, characters, memories, crushes, and minds into portable AI persona systems.**

[中文](README.md) · [English](README_EN.md) · [日本語](README_JA.md) · **한국어** · [Español](README_ES.md)

</div>

K.skill은 local-first **Persona Pack OS**이며 바로 사용할 수 있는完整人格시스템입니다. 채팅 로그, 관계 자료, 오리지널 캐릭터, Movie Character, 세계관, 공개 글, 개인 원칙을 검사 가능하고 테스트 가능하며 내보낼 수 있는 persona pack으로 바꿉니다. GUI에서는 업로드, 파싱, 리포트, Reply Lab, 다운로드를 처리하고, CLI에서는 같은 pack을 Codex, Claude, ChatGPT, DeepSeek, SillyTavern, Hermes, LobeChat, Open WebUI로 compile / export합니다.

여기에 적힌 기능은 실제 명령, 예제 입력, 생성 파일, 릴리스 검사를 갖습니다. 빈 prompt 포장이 아닙니다.

## DM 장면부터 보기

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA가 메시지를 보냈고, 이어가야 할지, 기다려야 할지, 약속을 제안해도 되는지, 주제를 바꿔야 할지 모를 때가 있습니다. K.skill의 Crush Coach는 대화를 사회적 신호로 읽고, 조작적 문구가 아니라 존중 가능한 다음 행동을 제안합니다.

```text
TA: Maybe this weekend. Do you like this kind of exhibition too?

K.skill:
- relationship stage: warm
- warmth: TA가 질문을 돌려주고 전시 주제를 열어 둠
- risk: 최근 턴에 명확한 거절이나 불편함 표현 없음
- evidence: question, interest topic, relaxed tone
- confidence: 0.76
- safety: no impersonation, no pressure after refusal

Reply Lab:
Safe: That actually made me curious. Which part would you recommend for someone going in fresh?
Light: You sound way more animated when you talk about this exhibit. I am taking notes, promise not to ask too many beginner questions.
Slightly forward: Low-pressure idea: if you feel like going one day, call me. I will keep my amateur commentary under control.
```

채팅에 명확한 거절, 불편함, 중단 요청이 있으면 K.skill은 관계를 밀어붙이는 전략을 만들지 않습니다. 예의 있는 마무리, 사과, 경계 존중, 자기 복기만 제공합니다.

## 네 가지 제품 워크플로

![K.skill GUI workflow](assets/readme/web-gui-flow.png)

| Workflow | 대상 | 입력 | 출력 | 사용 시점 |
|---|---|---|---|---|
| **Crush Coach** | TA와 자연스럽게 소통하고 싶은 사람 | WeChat, QQ, iMessage, Telegram, WhatsApp, pasted chat logs | `pursuit_report.md`, `topic_plan.md`, 3개 reply, send-or-not 판단 | 답장, 초대, 대기 판단이 어려울 때 |
| **Relationship Memory** | 연인, 친구, 전 연인, 친밀한 관계 자료를 정리하는 사람 | 채팅, 공유 기억, 보정 메모 | 관계 기억, 호칭 패턴, 공유 에피소드, boundary notes, exportable persona pack | 관계 복기, 장기 문맥, 글쓰기, 인터랙티브 스토리 |
| **Character World** | OC 작가, 2D 캐릭터 사용자, 롤플레이, 게임/영화 창작자 | Markdown 설정, character card, lorebook, Movie Character notes | 캐릭터 정체성, 세계 규칙, Prompt Stack, SillyTavern card, lorebook | 말버릇이 아니라 기억과 세계 규칙이 필요할 때 |
| **Life Mentor** | 공개 글과 개인 원칙을 대화형 사고 모델로 만들고 싶은 사람 | articles, interviews, public notes, decision records, personal principles | mental models, heuristics, anti-patterns, evidence, confidence, honesty boundaries | 의사결정, 회고, 개인 OS, 사고 보조 |

기능 경계는 분명합니다.

- **Crush Coach**는 존중 있는 관계 진행만 다루며 거절을 우회하지 않습니다.
- **Relationship Memory**는 장기 관계 문맥을 저장하고 검토하며 추구 전략을 만들지 않습니다.
- **Character World**는 fictional characters, original worlds, Movie Character, roleplay cards를 다루며 현실 인물을 사칭하지 않습니다.
- **Life Mentor**는 공개 자료와 사용자 노트를 사고 모델로 만들며 실제 인물이라고 주장하지 않습니다.

## Crush Coach

![K.skill Crush Coach social flow](assets/readme/crush-coach-reply-lab.png)

Crush Coach는 핵심 워크플로입니다. relationship stage, warmth signals, risk signals, topic windows, date readiness, boundaries를 분석합니다.

GUI:

1. `npm run dev` 또는 `npm run cli -- serve --port 5999`로 로컬 GUI를 시작합니다.
2. `Crush Coach`를 선택합니다.
3. 채팅 로그를 업로드하거나 최신 대화를 붙여넣습니다.
4. `me`와 `TA`의 speaker name을 설정합니다.
5. goal을 선택합니다: break ice, continue chat, judge chance, ask out, recover cold chat, write reply.
6. `Run lab`을 클릭합니다.
7. `pursuit_report.md`, `Reply Lab`, `topic_plan.md`를 확인합니다.

CLI:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
npm run cli -- send-or-not examples/crush-chat-en.txt --draft "Want to go together?" --latest "Maybe, I might go this weekend."
```

포함된 시나리오:

```text
examples/crush-chat-zh.txt       중국어 warm progression
examples/crush-chat-en.txt       영어 continuation
examples/refusal-chat-en.txt     명확한 거절, 마무리만 허용
examples/cold-chat-zh.txt        식은 대화, 기다릴지 판단
```

생성 파일:

```text
tmp/pursuit-en/
  pursuit_report.md
  pursuit_report.json
  topic_plan.md
```

강한 판단에는 `evidence`와 `confidence`가 붙습니다. 근거가 약하면 약하다고 표시합니다.

## Relationship Memory

![K.skill relationship memory](assets/readme/relationship-memory-chat.png)

Relationship Memory는 관계 자료를 검토 가능한 장기 문맥으로 만듭니다. 공유 에피소드, 호칭 패턴, 취향, corrections, boundaries를 다룹니다. 현실 인물 복제가 아닙니다.

GUI:

1. `Relationship`를 선택합니다.
2. `examples/relationship-memory-chat.txt` 또는 자신의 자료를 업로드합니다.
3. speaker, message count, language, preview lines를 확인합니다.
4. local vault에 저장합니다.
5. Prompt Stack 또는 memory state를 확인합니다.
6. 준비되면 export합니다.

CLI:

```bash
npm run cli -- init "Rain Bookstore Memory" --type relationship --language zh --out local-packs/rain-bookstore
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/rain-bookstore
npm run cli -- memory local-packs/rain-bookstore
npm run cli -- inspect local-packs/rain-bookstore
```

출력:

- shared memory episodes
- relationship facts and address patterns
- preferences and corrections
- no impersonation boundaries
- exportable persona pack files

## Character World

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World는 fictional characters, original characters, anime-style OCs, worldbuilding, lorebooks, character cards를 위한 워크플로입니다. identity, world rules, memory triggers, voice rhythm, safety boundaries를 하나의 pack으로 유지합니다.

CLI:

```bash
npm run cli -- init "Rain Archive" --type character --language zh --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
npm run cli -- inspect local-packs/rain-archive
```

입력:

- original character sheets
- worldbuilding Markdown
- dialogue samples
- SillyTavern Character Card V2
- lorebook entries
- manual boundaries

출력:

- `persona.yaml`
- `persona.md`
- `memory.lorebook`
- `Prompt Stack`
- real client export bundles

## Movie Character

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character는 Character World의 구체적 예시입니다. original film characters, script roles, scene cards, character arcs, dialogue samples에 적합합니다. 보호된 영화 캐릭터를 복사하지 않고 배우를 모방하지 않으며 celebrity identity를 주장하지 않습니다.

CLI:

```bash
npm run cli -- init "Mira Vale" --type character --language en --out local-packs/mira-vale
npm run cli -- import examples/movie-character.md --type character --pack local-packs/mira-vale
npm run cli -- compile local-packs/mira-vale --target sillytavern --out local-packs/mira-vale/exports/sillytavern
npm run cli -- export-zip local-packs/mira-vale --target chatgpt --out local-packs/mira-vale/exports/chatgpt.zip
```

입력:

- script fragments
- character biography
- scene cards
- dialogue samples
- relationship map in text form
- public-domain or licensed material

출력은 character identity, arc, scene memory, voice rhythm, copyright / real-person boundaries, SillyTavern card, lorebook입니다.

## Virtual Persona

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona는 완전한 original AI companions, virtual streamer personas, game NPCs, social avatars, product characters를 위한 기능입니다. Relationship Memory와 달리 실제 친밀 관계나 private person을 대표하지 않습니다.

GUI:

1. `Character`를 선택합니다.
2. persona brief를 업로드하거나 붙여넣습니다.
3. source preview를 확인합니다.
4. import와 distill을 실행합니다.
5. Prompt Stack에서 identity, voice, memory, boundaries를 확인합니다.
6. target client로 export합니다.

CLI:

```bash
npm run cli -- init "Nova Social" --type character --language en --out local-packs/nova-social
npm run cli -- import examples/character-world.md --type character --pack local-packs/nova-social
npm run cli -- compile local-packs/nova-social --target lobe --out local-packs/nova-social/exports/lobe
```

## Life Mentor

![K.skill life mentor model](assets/readme/life-mentor-model.png)

Life Mentor는 public writing, interviews, personal notes, decision records, principles를 사고 동반 모델로 바꿉니다. reasoning habits와 communication style을 모델링하지만 실제 인물이 되지는 않습니다.

CLI:

```bash
npm run cli -- init "Decision Life Mentor" --type advisor --language en --out local-packs/decision-life-mentor
npm run cli -- import examples/life-mentor-source.md --type advisor --pack local-packs/decision-life-mentor
npm run cli -- distill local-packs/decision-life-mentor
npm run cli -- inspect local-packs/decision-life-mentor
```

Life Mentor가 추출하는 것:

- expression DNA
- mental models
- heuristics
- anti-patterns
- contradictions
- evidence / confidence
- honesty boundaries

public figures와 celebrities는 공개 자료 기반 Life Mentor model로만 처리됩니다. K.skill은 recognizable real-person substitute를 만들지 않고 private facts를 만들지 않으며 그 사람 본인이라고 말하지 않습니다.

## Persona Pack

```text
persona.yaml          structured persona pack
persona.md            readable persona description
sources/              imported material
memory/               episodes, corrections, lorebook
distillation/         evidence, claims, contradictions, runs
exports/              target-specific files
```

Prompt Stack:

```text
identity       role, voice, expression DNA
mental_models  Life Mentor or character reasoning models
memory         profile facts, relationship facts, episodes
boundaries     no impersonation, no pressure after refusal, safety limits
export layer   target platform format
```

## GUI

![K.skill local GUI flow](assets/readme/web-gui-flow.png)

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

보통 `http://127.0.0.1:5999`를 엽니다.

GUI flow:

1. Crush Coach, Relationship Memory, Character World, Life Mentor를 선택합니다.
2. pack name과 language를 입력합니다.
3. upload 또는 paste.
4. consent / privacy 확인.
5. parse preview 확인.
6. Crush Coach에서 Run lab.
7. report markdown 다운로드.
8. target client zip export.

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

## CLI

```bash
npm run cli -- --help
npm run cli -- init "My Pack" --type relationship --language en --out local-packs/my-pack
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/my-pack
npm run cli -- distill local-packs/my-pack
npm run cli -- inspect local-packs/my-pack
npm run cli -- memory local-packs/my-pack
npm run cli -- eval local-packs/my-pack
```

Crush Coach:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/cold-chat-zh.txt --me 我 --ta TA
npm run cli -- send-or-not examples/refusal-chat-en.txt --draft "Please give me one more chance." --latest "Please stop asking."
```

Export:

```bash
npm run cli -- compile local-packs/my-pack --target codex --out local-packs/my-pack/exports/codex
npm run cli -- export-zip local-packs/my-pack --target sillytavern --out local-packs/my-pack/exports/sillytavern.zip
```

## Export To Real Tools

![K.skill export matrix](assets/readme/export-matrix.png)

| Target | Files | How to use |
|---|---|---|
| Codex | `SKILL.md`, `references/persona.md`, `references/memory.md`, `references/evidence.json` | Codex skills path에 배치 |
| Claude | `SKILL.md`, `references/` | Claude Code skill로 설치 |
| ChatGPT | `instructions.md`, `knowledge/`, `gpt-config.json` | GPT 또는 Project에 instructions와 knowledge 업로드 |
| DeepSeek | `system-prompt.json`, `api-request.json` | system context 또는 request template로 사용 |
| SillyTavern | `character-card-v2.json`, `lorebook.json` | card와 lorebook import |
| Hermes | `SOUL.md`, `skills/` | `SOUL.md`를 primary identity로 사용 |
| LobeChat | `lobe-agent.json` | agent JSON import |
| Open WebUI | `openwebui-agent.json` | agent/model JSON import |

```bash
npm run check:exports
```

## Privacy And Safety

K.skill is local-first. Private chats do not enter Git. 외부 provider를 명시적으로 설정하지 않으면 자료는 로컬에 남습니다.

Rules:

- no impersonation
- no pressure after refusal
- no coercive tactics
- no privacy extraction
- no stalking, harassment, or boundary bypass
- no invented private facts
- low evidence means low confidence

TA가 거절하면 K.skill은 closing, apology, stopping escalation, respecting space, self-review만 허용합니다.

## Development And Verification

![K.skill complete product workbench](assets/readme/hero-persona-workbench.png)

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
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

`npm run verify`는 lint, tests, build, exports, README checks, e2e, smoke, release scoring, npm pack dry-run을 실행합니다. README checks는 5개 언어, images, commands, targets, Life Mentor naming, safety, no outside comparison claims를 강제합니다.

## License

Apache-2.0
