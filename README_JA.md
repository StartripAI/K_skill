<div align="center">

# K.skill

![K.skill Voice Memory Studio](assets/readme/voice-memory-studio.png)

**音声、チャット、キャラクター、関係記憶、Life Mentor を使える AI persona pack にするローカル人格ワークベンチ。**  
**Local voice + persona workbench for chats, characters, relationship memory, and Life Mentor packs.**

[中文](README.md) · [English](README_EN.md) · **日本語** · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

K.skill は local-first の人格ワークベンチです。チャットログ、関係資料、二次元 OC、Movie Character、Virtual Persona、世界観、公開文章、個人原則を、検査できる、テストできる、書き出せる persona pack に変換します。GUI ではアップロード、解析、レポート、Reply Lab、ダウンロードまで行えます。CLI では同じ pack を Codex、Claude、ChatGPT、DeepSeek、SillyTavern、Hermes、LobeChat、Open WebUI に compile / export できます。

ここに書かれている機能は、実際のコマンド、実例ファイル、生成物、release gate を持ちます。

## Main Hook: Voice Memory

![K.skill Voice Memory Studio](assets/readme/voice-memory-studio.png)

文字も大事ですが、声はもっと速く届きます。間、笑い方、口癖、速度、感情の温度は、長いメモよりも「その人らしさ」を運びます。

K.skill は voice を persona source として扱います。

| Moment | 入れるもの | K.skill が作るもの |
|---|---|---|
| 誰かを思い出す | voice note、チャット、写真、共有記憶 | voice DNA、関係 memory、会話 rhythm、使える persona pack |
| 夢の中のキャラクター | 描写、character image、台詞音声、世界観 | 声の感触を持つ原创 character |
| 記念と回想 | 古いチャット、音声、screenshot、timeline | 読めて、聞けて、export できる memory pack |
| Crush Coach Voice | TA の voice note と最近のチャット | ASR transcript、tone read、warmth signals、3 つの返信 |
| Virtual / Movie Character | character art、dialogue、voice reference、scene cards | voice profile、visual style、sticker intents、export bundle |

動くコマンド:

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

`local-voice-clone` は `text`、`voice`、`language`、`referenceAudioPath`、`voiceProfilePath`、`outFile` を stdin JSON でローカル voice engine に渡します。engine が `outFile` に音声を書き、K.skill が GUI、CLI、export に戻します。

## まず 6 つのシーンを見る

![K.skill six social persona scenes](assets/readme/hero-six-scenes.png)

K.skill は単なるチャット画面ではありません。

| Scene | 入れるもの | 返ってくるもの |
|---|---|---|
| Crush Coach | TA とのチャット | social signals、次の一手、3 つの返信 |
| Relationship Memory | チャット、共有記憶、補足メモ | 長期文脈の関係 memory pack |
| Anime Character | OC 設定、世界観、台詞サンプル | character identity、voice、lorebook |
| Movie Character | 脚本片段、scene cards、人物小伝 | arc と scene memory を持つ映画風 persona |
| Virtual Persona | AI companion brief、avatar notes、NPC design | 安定して話せる原创 persona |
| Public-Figure Life Mentor | 記事、インタビュー、発表、ノート | 公開資料ベースの thinking model |

たとえば公開された創業者資料を集めると、プロダクト判断、文章、選択、トレードオフを一緒に考える Life Mentor として使えます。

## まず DM の瞬間を見る

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA から返信が来た。続けるべきか、少し待つべきか、誘ってよいのか、話題を変えるべきか分からない。Crush Coach は会話を社交シグナルとして読み、自然に見える次の一言を出します。

```text
TA: Maybe this weekend. Do you like this kind of exhibition too?

K.skill:
- relationship stage: warm
- warmth: TA が質問を返し、展示の話題を開いたままにしている
- risk: まだ軽いトーンが合う
- evidence: question, interest topic, relaxed tone
- confidence: 0.76
- rhythm: 返信は軽く、会話に余白を残す

Reply Lab:
Safe: That actually made me curious. Which part would you recommend for someone going in fresh?
Light: You sound way more animated when you talk about this exhibit. I am taking notes, promise not to ask too many beginner questions.
Slightly forward: Low-pressure idea: if you feel like going one day, call me. I will keep my amateur commentary under control.
```

空気が冷えたときは、きれいに締める、少し待つ、軽い話題に戻す、という形で会話の余白を作ります。

## 4 つのプロダクトワークフロー

![K.skill GUI workflow](assets/readme/web-gui-flow.png)

| Workflow | 向いている人 | 入力 | 出力 | 使う場面 |
|---|---|---|---|---|
| **Crush Coach** | TA と自然にやり取りしたい人 | WeChat、QQ、iMessage、Telegram、WhatsApp、貼り付けチャット | `pursuit_report.md`、`topic_plan.md`、3 つの返信、send-or-not 判断 | 返信、誘い、待つ判断に迷うとき |
| **Relationship Memory** | 恋人、友人、元恋人、親密な関係資料を整理したい人 | チャット、共有記憶、補足メモ | 関係記憶、呼び方、共有エピソード、空気感、exportable persona pack | 関係の復盤、長期文脈、創作、対話物語 |
| **Character World** | OC 作者、二次元ユーザー、ロールプレイ、ゲーム/映画制作者 | Markdown 設定、character card、lorebook、Movie Character | 角色身份、世界规则、Prompt Stack、SillyTavern card、lorebook | 口癖だけでなく、記憶と世界ルールが必要なとき |
| **Life Mentor** | 公開文章や自分の原則を対話モデルにしたい人 | 記事、インタビュー、公開メモ、意思決定記録、個人原則 | mental models、heuristics、anti-patterns、evidence、confidence、honesty notes | 意思決定、復盤、個人 OS、思考補助 |

目的ごとに入口を選べます。

- **Crush Coach** は返信、タイミング、自然な会話の進め方に使います。
- **Relationship Memory** は共有記憶、関係の空気、長期文脈に使います。
- **Character World** は二次元 OC、虚構角色、Movie Character、lorebook、roleplay cards に使います。
- **Life Mentor** は公開資料と自分のメモを思考モデルにします。

## Voice Studio

K.skill は文字だけではありません。ひとつの intake で **voice note**、録音、スクリーンショット、image、sticker、emoji メモ、PDF、video transcript、mixed ZIP を扱えます。  
先に **multimodal import** を行い、文字は chat turns、音声は **ASR** で transcript evidence、image / screenshot / PDF / video transcript は media evidence、sticker は **sticker intents** になります。その同じ evidence を Crush Coach、Relationship Memory、Character World、Life Mentor が使います。

CLI:

```bash
npm run cli -- transcribe tests/fixtures/media/voice-note-en.wav --provider stub-asr --language en --out tmp/transcript.json
npm run cli -- import tests/fixtures/media/voice-note-en.wav --type pursuit --media --provider stub-asr --pack local-packs/voice-crush
npm run cli -- speak local-packs/voice-crush --text "Keep it light and natural." --provider stub-tts --out tmp/voice-preview.wav
npm run cli -- voice-profile local-packs/voice-crush
```

GUI:

1. `DM intake` で `Files / Paste / Record / Media` を選ぶ。
2. chat log、voice note、screenshot、sticker、PDF、video transcript、ZIP を入れる。
3. `Record` で短い voice note を録り、ASR 後に Reply Lab へ入れる。
4. `Parse preview` は message、asset、transcript、reaction、attachment kind を表示。
5. `Persona Voice` は voice DNA、TTS preview、visual style、sticker intents を export に含めます。

## Crush Coach

![K.skill Crush Coach social flow](assets/readme/crush-coach-reply-lab.png)

Crush Coach は「この一言をどう返すか」から始めたいときの入口です。relationship stage、warmth signals、risk signals、topic windows、date readiness、chat rhythm を読みます。

GUI:

1. `npm run dev` または `npm run cli -- serve --port 5999` でローカル GUI を起動。
2. `Crush Coach` を選ぶ。
3. チャットログをアップロード、または最新会話を貼り付ける。
4. `me` と `TA` の speaker name を設定。
5. goal を選ぶ：break ice、continue chat、judge chance、ask out、recover cold chat、write reply。
6. `Run lab` を押す。
7. `pursuit_report.md`、`Reply Lab`、`topic_plan.md` を確認。

CLI:

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/crush-chat-en.txt --me Me --ta TA
npm run cli -- send-or-not examples/crush-chat-en.txt --draft "Want to go together?" --latest "Maybe, I might go this weekend."
```

同梱シナリオ:

```text
examples/crush-chat-zh.txt       中国語の温かい進展
examples/crush-chat-en.txt       英語の自然な継続
examples/cold-chat-zh.txt        冷えた会話、待つべきか判断
```

生成物:

```text
tmp/pursuit-en/
  pursuit_report.md
  pursuit_report.json
  topic_plan.md
```

強い判断には `evidence` と `confidence` が付きます。証拠が薄いときは、薄いまま表示されます。

## Relationship Memory

![K.skill relationship memory](assets/readme/relationship-memory-chat.png)

Relationship Memory は関係資料を監査可能な長期文脈にします。共有エピソード、呼び方、好み、訂正、小さな空気感まで整理します。

GUI:

1. `Relationship` を選ぶ。
2. `examples/relationship-memory-chat.txt` または自分の資料をアップロード。
3. speaker、message count、language、preview line を確認。
4. local vault に保存。
5. Prompt Stack または memory state を確認。
6. 準備できたら export。

CLI:

```bash
npm run cli -- init "Rain Bookstore Memory" --type relationship --language zh --out local-packs/rain-bookstore
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/rain-bookstore
npm run cli -- memory local-packs/rain-bookstore
npm run cli -- inspect local-packs/rain-bookstore
```

出力:

- shared memory episodes
- relationship facts と address patterns
- preferences と corrections
- tone と memory notes
- exportable persona pack files

## Character World

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World は虚構キャラクター、原创キャラクター、二次元 OC、世界観、lorebook、character card のためのワークフローです。身份、世界ルール、memory triggers、voice rhythm を同じ pack に入れます。

CLI:

```bash
npm run cli -- init "Rain Archive" --type character --language zh --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
npm run cli -- inspect local-packs/rain-archive
```

入力:

- original character sheets
- worldbuilding Markdown
- dialogue samples
- SillyTavern Character Card V2
- lorebook entries
- manual tone notes

出力:

- `persona.yaml`
- `persona.md`
- `memory.lorebook`
- `Prompt Stack`
- real client export bundles

## Movie Character

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character は Character World の具体例です。映画風の人物、脚本角色、scene cards、character arc、dialogue samples に向いています。脚本角色の chat 版だと考えると分かりやすいです。

CLI:

```bash
npm run cli -- init "Mira Vale" --type character --language en --out local-packs/mira-vale
npm run cli -- import examples/movie-character.md --type character --pack local-packs/mira-vale
npm run cli -- compile local-packs/mira-vale --target sillytavern --out local-packs/mira-vale/exports/sillytavern
npm run cli -- export-zip local-packs/mira-vale --target chatgpt --out local-packs/mira-vale/exports/chatgpt.zip
```

入力:

- script fragments
- character biography
- scene cards
- dialogue samples
- relationship map in text form
- public-domain or licensed material

出力は character identity、arc、scene memory、voice rhythm、source notes、SillyTavern card、lorebook です。

## Virtual Persona

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona は AI companion、virtual streamer persona、game NPC、social avatar、product character を自分の brief から作る流れです。

GUI:

1. `Character` を選ぶ。
2. persona brief をアップロードまたは貼り付け。
3. source preview を確認。
4. import と distill。
5. Prompt Stack で identity、voice、memory、rhythm を確認。
6. target client に export。

CLI:

```bash
npm run cli -- init "Nova Social" --type character --language en --out local-packs/nova-social
npm run cli -- import examples/character-world.md --type character --pack local-packs/nova-social
npm run cli -- compile local-packs/nova-social --target lobe --out local-packs/nova-social/exports/lobe
```

## Life Mentor

![K.skill life mentor model](assets/readme/life-mentor-model.png)

Life Mentor は公開文章、インタビュー、個人ノート、意思決定記録、原則を思考の伴走モデルにします。推論習慣、コミュニケーションスタイル、判断の癖、トレードオフを扱います。

CLI:

```bash
npm run cli -- init "Decision Life Mentor" --type advisor --language en --out local-packs/decision-life-mentor
npm run cli -- import examples/life-mentor-source.md --type advisor --pack local-packs/decision-life-mentor
npm run cli -- distill local-packs/decision-life-mentor
npm run cli -- inspect local-packs/decision-life-mentor
```

Life Mentor が抽出するもの:

- expression DNA
- mental models
- heuristics
- anti-patterns
- contradictions
- evidence / confidence
- honesty notes

public figures や celebrities は公開資料の Life Mentor model と相性が良いです。インタビュー、記事、発表、メモを集めると、product judgment、writing、choices、tradeoffs を質問できます。

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
rhythm         relationship pacing, tone, reply feel, conversation texture
export layer   target platform format
```

## GUI

![K.skill local GUI flow](assets/readme/web-gui-flow.png)

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

通常は `http://127.0.0.1:5999` を開きます。

GUI flow:

1. Crush Coach、Relationship Memory、Character World、Life Mentor を選ぶ。
2. pack name と language を入力。
3. upload または paste。
4. consent / privacy を確認。
5. parse preview を読む。
6. Crush Coach では Run lab。
7. report markdown を download。
8. target client の zip を export。

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
npm run cli -- send-or-not examples/crush-chat-en.txt --draft "Want to go together this weekend?" --latest "Maybe, I might go this weekend."
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
| Codex | `SKILL.md`, `references/persona.md`, `references/memory.md`, `references/evidence.json` | Put the exported skill directory in your Codex skills path |
| Claude | `SKILL.md`, `references/` | Install as a Claude Code skill |
| ChatGPT | `instructions.md`, `knowledge/`, `gpt-config.json` | Paste instructions into a GPT or Project and upload knowledge |
| DeepSeek | `system-prompt.json`, `api-request.json` | Use as system context or request template |
| SillyTavern | `character-card-v2.json`, `lorebook.json` | Import the card and lorebook |
| Hermes | `SOUL.md`, `skills/` | Use `SOUL.md` as primary identity |
| LobeChat | `lobe-agent.json` | Import the agent JSON |
| Open WebUI | `openwebui-agent.json` | Import the agent/model JSON |

```bash
npm run check:exports
```

## Privacy And Feel

K.skill is local-first. Private chats stay out of Git. Content leaves your machine only when you explicitly configure an external provider.

K.skill が得意なこと:

- chat の空気を読む
- relationship memory を整理する
- original character を作る
- public material を Life Mentor にする
- 同じ pack を real AI tools に export する
- evidence と confidence を見える形にする

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

`npm run verify` runs lint, tests, build, exports, README checks, e2e, smoke, release scoring, and npm pack dry-run. README checks enforce five languages, images, commands, targets, Life Mentor naming, product concepts, and K.skill-only positioning.

## License

Apache-2.0
