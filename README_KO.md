# K.skill

![K.skill workbench](assets/hero-chat-workbench.svg)

**K.skill은 채팅, 캐릭터, 기억, 사고 모델을 이동 가능한 AI 페르소나 시스템으로 바꿉니다.**

언어: [中文](README.md) · [English](README_EN.md) · [日本語](README_JA.md) · **한국어** · [Español](README_ES.md)

## 기능

- 연인 / 관계 기억
- 오리지널 캐릭터 / 세계관
- 멘토 / 사고 모델 증류
- **호감 상대 코치**: 채팅 기록을 분석해 온도, 위험 신호, 주제, 답장 후보를 제안합니다

## 시작하기

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
```

보통 `http://127.0.0.1:5173` 에서 열립니다.

## CLI 예시

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA
npm run cli -- init "Rain Archive" --type character --language ko --out local-packs/rain-archive
npm run cli -- compile local-packs/rain-archive --target sillytavern
```

## 안전

K.skill은 조작, PUA, 거절 무시, 사칭, 스토킹을 돕지 않습니다. 상대가 거절하면 경계 존중, 사과, 대화 종료만 제안합니다.
