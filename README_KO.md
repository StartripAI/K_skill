<div align="center">

# K.skill

![K.skill social persona system](assets/hero-chat-workbench.svg)

**K.skill은 채팅, 캐릭터, 기억, 호감 상대와의 대화, 사고 모델을 이동 가능한 AI 페르소나 시스템으로 바꿉니다.**

언어: [中文](README.md) · [English](README_EN.md) · [日本語](README_JA.md) · **한국어** · [Español](README_ES.md)

</div>

<p align="center">
  <img src="assets/readme-dm-flow.svg" width="32%" alt="DM flow">
  <img src="assets/prompt-stack-social.svg" width="32%" alt="Prompt Stack inspector">
  <img src="assets/persona-export-matrix.svg" width="32%" alt="Export matrix">
</p>

## K.skill이 하는 일

K.skill은 로컬 우선 **Persona Pack OS**입니다. 채팅 로그, 관계 메모, 오리지널 캐릭터 설정, SillyTavern 카드, 공개 글, 멘토 자료, 자기 기록을 가져와 검사 가능하고 테스트 가능하며 여러 클라이언트로 내보낼 수 있는 persona pack으로 정리합니다.

첫 화면은 개발 도구보다 소셜 앱에 가깝습니다. 스토리, DM, 답장 카드, 관계 온도, evidence, confidence, export 버튼을 먼저 보여주고, 그 다음 CLI와 schema를 다룹니다.

```text
자료 업로드/붙여넣기 -> 파싱 -> 증류 -> 기억 -> Prompt Stack -> eval -> export -> chat test
```

핵심 워크플로:

- **Crush Coach**: 채팅 신호를 읽고, 존중을 지키는 답장을 만든다.
- **관계 기억**: 공유 경험, 호칭, 경계, 중요한 에피소드를 보존한다.
- **캐릭터 / 세계관**: OC 설정, 세계관 Markdown, SillyTavern Character Card를 persona pack으로 만든다.
- **멘토 / 자기 모델**: 표현 DNA, 사고 모델, 의사결정 휴리스틱, 반패턴, 정직성 경계를 증류한다.

## 빠른 시작

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
```

Vite가 출력하는 로컬 URL을 엽니다. 보통 `http://127.0.0.1:5173` 입니다.

CLI:

```bash
npm run cli -- --help
```

로컬 전역 명령으로 시험:

```bash
npm link
kskill --help
```

## 5분 Crush Coach

채팅 분석:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out --out pursuit-output
```

생성 파일:

```text
pursuit-output/
  pursuit_report.md
  topic_plan.md
```

지금 보낼 수 있는 답장 3개 생성:

```bash
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA --style natural
```

주제 계획 생성:

```bash
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
```

거절이 포함된 상황:

```bash
npm run cli -- pursue examples/refusal-chat-en.txt --me Me --ta TA --goal recover_cold_chat
```

상대가 거절하거나 불편함을 표현하면 K.skill은 경계 존중, 짧은 사과, 대화 종료, 자기 점검만 제안합니다. 압박하거나 거절을 우회하는 문구는 제공하지 않습니다.

## Reply Lab

Reply Lab은 K.skill의 DM 답장 실험실입니다. 최신 메시지와 전체 맥락을 함께 보고, 보낼 수 있는 답장 3개를 만듭니다.

- safe / playful / sincere / restrained / direct / gentle 같은 라벨
- 현재 stage에 맞는 이유
- 예상 효과
- 위험 메모
- `boundarySafe: true`

목표는 상대를 조종하는 것이 아니라, 실제 의도를 덜 모호하고 덜 부담스럽게 표현하는 것입니다.

## Persona Pack 만들기

```bash
npm run cli -- init "Rain Archive" --type character --language ko --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
```

Prompt Stack, 메모리, 검사:

```bash
npm run cli -- inspect local-packs/rain-archive
npm run cli -- memory local-packs/rain-archive
npm run cli -- eval local-packs/rain-archive
```

구조:

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

## Prompt Stack, evidence, confidence

K.skill은 하나의 긴 prompt가 아니라 여러 층으로 persona를 구성합니다.

- **Identity**: 역할, 목소리, 표현 DNA, 허용된 사용.
- **Memory**: 에피소드, 관계 사실, 선호, 수정 기록, lorebook.
- **Mental models**: 판단 방식, 휴리스틱, 반패턴.
- **Evidence**: quote, claim, source id, kind, confidence.
- **Safety**: 사칭 금지, 거절 후 압박 금지, 사적 사실 조작 금지.
- **Export layer**: 각 클라이언트에 맞춘 지시문.

근거가 약한 내용은 불확실성으로 남기며 사실처럼 승격하지 않습니다.

## 내보내기

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

| 대상 | 출력 |
|---|---|
| Codex | `SKILL.md`와 `references/` |
| Claude Code | `SKILL.md`와 `references/` |
| ChatGPT | `instructions.md`와 `knowledge/` |
| DeepSeek / OpenAI-compatible API | `system-prompt.json` |
| SillyTavern | Character Card V2 JSON과 lorebook |
| Hermes | `SOUL.md`와 skills |
| LobeChat | agent JSON |
| Open WebUI | agent JSON |

## 기준선 대비 개선

| 영역 | 기존 baseline | K.skill 개선 |
|---|---|---|
| `ex-skill` | 관계 기억, 말투, 공유 경험 | 관계 stage, 온도/위험 신호, Reply Lab, 경계 우선 Crush Coach |
| `nuwa-skill` | 사고 모델, 표현 DNA, 정직성 경계 | 멘토, 캐릭터, 자기 모델, 연인/친구를 같은 pack 형식으로 다룸 |
| ST memory | 구조화 장기 기억 | evidence, confidence, 수정, eval, Prompt Stack 검사를 추가 |
| SillyTavern | 캐릭터 카드와 lorebook | 하나의 클라이언트에 묶이지 않고 Codex, Claude, ChatGPT, DeepSeek, SillyTavern, Hermes, LobeChat, Open WebUI로 export |

## 안전과 경계

- 기본은 로컬 실행입니다.
- 개인 채팅 기록을 Git에 커밋하지 않습니다.
- PUA, 질투 유도, 압박, 거절 우회, 스토킹, 사칭을 돕지 않습니다.
- 동의 없이 실제 private person을 본인처럼 시뮬레이션하지 않습니다.
- 거절이나 불편함이 나오면 관계 추진을 멈춥니다.
- 외부 도구로 export하기 전에 자료 사용 권한을 확인합니다.

## 개발

```bash
npm install
npm run lint
npm test
npm run build
```

## License

MIT
