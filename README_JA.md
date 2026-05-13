<div align="center">

# K.skill

![K.skill social persona system](assets/hero-chat-workbench.svg)

**K.skill はチャット、キャラクター、記憶、好きな人への返信、思考モデルを、持ち運べる AI ペルソナシステムに変換します。**

言語: [中文](README.md) · [English](README_EN.md) · **日本語** · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

<p align="center">
  <img src="assets/readme-dm-flow.svg" width="32%" alt="DM flow">
  <img src="assets/prompt-stack-social.svg" width="32%" alt="Prompt Stack inspector">
  <img src="assets/persona-export-matrix.svg" width="32%" alt="Export matrix">
</p>

## K.skill とは

K.skill はローカル優先の **Persona Pack OS** です。チャットログ、関係メモ、オリジナルキャラクター設定、SillyTavern カード、公開文章、メンター資料、自分のノートを取り込み、検査できる、テストできる、書き出せる persona pack に変換します。

最初の体験は開発ツールではなく、SNS / DM に近い設計です。ストーリー、会話の温度、返信カード、根拠、confidence、エクスポート先を先に見せ、その後に schema や CLI を扱います。

```text
素材をアップロード/貼り付け -> 解析 -> 蒸留 -> 記憶 -> Prompt Stack -> eval -> export -> chat test
```

主なワークフロー:

- **Crush Coach**: チャットの温度、リスク、話題の窓を読み、境界を尊重する返信を作る。
- **関係記憶**: 共有体験、呼び方、境界、重要なエピソードを整理する。
- **キャラクター / 世界観**: OC、世界観 Markdown、SillyTavern Character Card を persona pack にする。
- **メンター / 自己モデル**: 表現 DNA、思考モデル、判断ヒューリスティック、反パターン、誠実さの境界を蒸留する。

## クイックスタート

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
npm run dev
```

Vite が表示するローカル URL を開きます。通常は `http://127.0.0.1:5173` です。

CLI:

```bash
npm run cli -- --help
```

ローカルでグローバルコマンドとして試す場合:

```bash
npm link
kskill --help
```

## 5 分で試す Crush Coach

チャットを分析:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal ask_out --out pursuit-output
```

生成物:

```text
pursuit-output/
  pursuit_report.md
  topic_plan.md
```

今送れる返信を 3 案生成:

```bash
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA --style natural
```

話題計画を生成:

```bash
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
```

拒否があるケース:

```bash
npm run cli -- pursue examples/refusal-chat-en.txt --me Me --ta TA --goal recover_cold_chat
```

相手が拒否した、または不快感を示した場合、K.skill は境界の尊重、短い謝罪、会話の終了、自己反省だけを提案します。押し切るための文章は出しません。

## Reply Lab

Reply Lab は K.skill の DM 的な返信実験室です。最新メッセージと文脈を見て、送信可能な 3 案を返します。

- safe / playful / sincere / restrained / direct / gentle などのラベル
- なぜ現在の stage に合うか
- 期待される効果
- リスクメモ
- `boundarySafe: true`

目的は相手をコントロールすることではありません。自分の本音を、曖昧さと圧を減らして伝えることです。

## Persona Pack の作り方

```bash
npm run cli -- init "Rain Archive" --type character --language ja --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
```

Prompt Stack、記憶、検査:

```bash
npm run cli -- inspect local-packs/rain-archive
npm run cli -- memory local-packs/rain-archive
npm run cli -- eval local-packs/rain-archive
```

構造:

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

## Prompt Stack と evidence / confidence

K.skill は「一つの長い prompt」ではなく、層として persona を扱います。

- **Identity**: 役割、声、表現 DNA、許可された用途。
- **Memory**: エピソード、関係事実、好み、修正、lorebook。
- **Mental models**: 判断基準、ヒューリスティック、反パターン。
- **Evidence**: quote、claim、source id、kind、confidence。
- **Safety**: なりすまし禁止、拒否後の圧力禁止、私的事実の捏造禁止。
- **Export layer**: 各クライアント向けの指示。

根拠が弱いものは不確実性として残し、事実として扱いません。

## エクスポート

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

| 対象 | 出力 |
|---|---|
| Codex | `SKILL.md` と `references/` |
| Claude Code | `SKILL.md` と `references/` |
| ChatGPT | `instructions.md` と `knowledge/` |
| DeepSeek / OpenAI 互換 API | `system-prompt.json` |
| SillyTavern | Character Card V2 JSON と lorebook |
| Hermes | `SOUL.md` と skills |
| LobeChat | agent JSON |
| Open WebUI | agent JSON |

## 参考プロジェクトからの改善

| 領域 | 既存の baseline | K.skill の改善 |
|---|---|---|
| `ex-skill` | 関係記憶、口調、共有体験 | 関係 stage、温度/リスク、Reply Lab、境界優先の Crush Coach |
| `nuwa-skill` | 心智モデル、表現 DNA、誠実さの境界 | メンター、キャラクター、自分、恋人/友人を同じ pack 形式で扱う |
| ST memory | 構造化された長期記憶 | evidence、confidence、修正履歴、eval、Prompt Stack 検査を追加 |
| SillyTavern | キャラクターカードと lorebook | 1 クライアントに固定せず Codex、Claude、ChatGPT、DeepSeek、SillyTavern、Hermes、LobeChat、Open WebUI に出す |

## 安全と境界

- デフォルトはローカル実行。
- 私的なチャットログを Git に入れない。
- PUA、嫉妬を作る戦術、圧力、拒否の回避、ストーキング、なりすましを支援しない。
- 実在の private person を、同意なしに本人としてシミュレーションしない。
- 拒否や不快感が出たら、そこで進展を止める。
- 第三者ツールへ出す前に、素材を使う権利を確認する。

## 開発

```bash
npm install
npm run lint
npm test
npm run build
```

## License

MIT
