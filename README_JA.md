<div align="center">

# K.skill

![K.skill film voice memory hero](assets/readme/hero-voice-memory-film-v3.png)

**声、チャット、画像、キャラクター設定、関係の記憶を、聞けて、話せて、持ち出せる persona pack へ。**<br>
**A voice-first place to keep chats, memories, characters, and Life Mentor packs alive locally.**

[中文](README.md) · [English](README_EN.md) · **日本語** · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

ふと聞き返したくなる声、チャットの中だけで通じる冗談、写真に残った表情、夢に出てきた人、まだ輪郭だけのキャラクター。そういう断片は、短い説明にするとすぐ薄くなります。

K.skill は、その断片をあとで開いて話せる local-first の persona pack にまとめます。voice note、チャットログ、スクリーンショット、キャラクター画像、世界観、公開文章、個人の原則を入れると、見返せて、会話を続けられて、必要な場所へ持ち出せる形になります。文字は出来事をほどき、声はその場に残っていた温度を戻します。

まずはサンプルで、声、関係、キャラクターがどう pack に変わるかを見てから、自分の素材に置き換えられます。

## Voice Memory：声を人格の中に入れる

![K.skill voice memory flow](assets/readme/voice-memory-anime-v3.png)

思い出すのは、言葉そのものだけではないことがあります。<br>
少し空いた間、笑い方、口癖、返事が半拍遅れる感じ、急にやわらぐ声。そういう細部のほうが、長いメモよりもはっきり「その人」を連れてきます。夢に出てきた人や、まだ名前しかないキャラクターでも同じです。声の気配があるだけで、会話は急に近くなります。

K.skill では Voice Memory が入り口になります。音声はまず確認できる transcript になり、そこから voice DNA、chat rhythm、relationship memory、キャラクターの口調、export できる pack へ沈んでいきます。voice note だけで始めても、チャット、画像、sticker、PDF、video transcript と混ぜても構いません。

| やりたいこと | 入れるもの | K.skill が作るもの |
|---|---|---|
| 誰かを思い出したい | voice note、昔のチャット、写真、共有した出来事 | voice DNA、relationship memory、chat rhythm、また開ける persona pack |
| 夢に出てきた人を形にしたい | 描写、character image、台詞音声、世界観 | 声の気配があり、会話と物語を伸ばせる original character |
| 関係を静かに振り返りたい | 古い音声、screenshot、timeline、補足メモ | 読めて、聞けて、見返せて、export できる Relationship Memory |
| TA から voice note が来た | TA の voice note、最近のチャット、自分の目的 | ASR transcript、tone read、warmth signals、編集できる 3 つの返信 |
| Movie / Virtual Character を作りたい | character art、dialogue、voice reference、scene cards | voice profile、visual style、sticker intents、complete export bundle |

まずは内蔵サンプルで流れを確認し、そのあと自分の local voice engine につなげられます。

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

`local-voice-clone` は `text`、`voice`、`language`、`referenceAudioPath`、`voiceProfilePath`、`outFile` を stdin JSON で local voice engine に渡します。engine が `outFile` に音声を書き、K.skill がそれを GUI、CLI、export に戻します。

## まず 6 つのシーンを見る

![K.skill six social persona scenes](assets/readme/persona-scenes-social-v3.png)

K.skill は、ひとつのチャット画面だけを作るものではありません。入口は 6 つあります。

| Scene | 入れるもの | 返ってくるもの |
|---|---|---|
| Crush Coach | TA とのチャット | social signals、次の一手、3 つの自然な返信 |
| Relationship Memory | チャット、共有記憶、補足メモ | 長く使える関係 memory pack |
| Anime Character | OC 設定、世界観、台詞サンプル | character identity、voice、lorebook、会話入口 |
| Movie Character | script fragments、scene cards、人物小伝 | arc と scene memory を持つ映画風 persona |
| Virtual Persona | AI companion brief、avatar notes、NPC design | 安定して話せる original persona |
| Public-Figure Life Mentor | articles、interviews、launches、notes | 公開資料ベースの thinking model |

公開されている創業者や作者の文章、インタビュー、発表を集めると、製品判断、文章、選択、トレードオフを一緒に分解してくれる Life Mentor として使えます。

## まず DM の瞬間を見る

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA から返信が来た。すぐ返すのか、少し待つのか、誘っていいのか、話題を変えるべきなのか。Crush Coach はその迷いを、会話の social signals として読み直し、今の空気に合う次の一言を出します。

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

空気が冷えたときは、無理に押しません。きれいに締める、少し待つ、軽い話題に戻す。会話に余白を残す方向を提案します。

## 4 つのプロダクトワークフロー

| Workflow | 向いている人 | 入力 | 出力 | 使う場面 |
|---|---|---|---|---|
| **Crush Coach** | TA と自然にやり取りしたい人 | messaging app の export、貼り付けチャット | `pursuit_report.md`、`topic_plan.md`、3 つの返信、send-or-not 判断 | 返信、誘い、待つ判断に迷うとき |
| **Relationship Memory** | 恋人、友人、元恋人、親密な関係を整理したい人 | チャット、共有記憶、補足メモ | 関係記憶、呼び方、共有エピソード、空気感、exportable persona pack | 関係の復盤、長期文脈、創作、対話物語 |
| **Character World** | OC 作者、二次元ユーザー、ロールプレイ、ゲーム/映画制作者 | Markdown 設定、character card、lorebook、Movie Character | character identity、world rules、Prompt Stack、character card、lorebook | 口癖だけでなく、記憶と世界ルールが必要なとき |
| **Life Mentor** | 公開文章や自分の原則を対話できる思考モデルにしたい人 | 記事、インタビュー、公開メモ、意思決定記録、個人原則 | mental models、heuristics、anti-patterns、evidence、confidence、honesty notes | 意思決定、復盤、個人 OS、思考補助 |

目的ごとに入口を選べます。

- **Crush Coach** は返信、タイミング、自然な会話の進め方に使います。
- **Relationship Memory** は共有記憶、関係の空気、長期文脈を残すために使います。
- **Character World** は二次元 OC、fictional roles、Movie Character、lorebook、roleplay cards に使います。
- **Life Mentor** は公開資料と自分のメモを、質問できる思考モデルにします。

## Voice Studio

K.skill は文字だけを読む場所ではありません。ひとつの intake に **voice note**、録音、screenshot、image、sticker、emoji メモ、PDF、video transcript、mixed ZIP をまとめて入れられます。
最初に **multimodal import** が走ります。文字は chat turns へ、音声は **ASR** を通って transcript evidence へ、image / screenshot / PDF / video transcript は media evidence へ、sticker は **sticker intents** へ整理されます。その同じ evidence trail を Crush Coach、Relationship Memory、Character World、Life Mentor が読み継ぎます。

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

Crush Coach は「この一言をどう返すか」から始めたいときの入口です。relationship stage、warmth signals、risk signals、topic windows、date readiness、chat rhythm を見て、押すのか、引くのか、軽く残すのかを分けます。

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

Relationship Memory は関係の資料を、あとから確かめられる長期文脈にします。共有エピソード、呼び方、好み、訂正、言い過ぎたこと、言えなかったこと、小さな空気感まで、無理に物語化せず整理します。

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

Character World は fictional characters、original characters、二次元 OC、worldbuilding、lorebooks、character cards のためのワークフローです。誰なのか、どんな世界で生きているのか、何を覚えて反応するのか、どんな voice rhythm で話すのかを、同じ pack に入れます。

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
- character card JSON
- lorebook entries
- manual tone notes

出力:

- `persona.yaml`
- `persona.md`
- `memory.lorebook`
- `Prompt Stack`
- supported persona format bundles

## Movie Character

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character は Character World の中でも、映画の中にいる人物を会話できる形にする使い方です。script fragments、scene cards、character arc、dialogue samples を入れると、人物の弧、場面の記憶、台詞の間合いを持つ chat 版のキャラクター資料になります。

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

出力には character identity、arc、scene memory、voice rhythm、source notes、character card、lorebook が含まれます。

## Virtual Persona

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona は、AI companion、virtual streamer persona、game NPC、social avatar、product character を自分の brief から作る流れです。実在の誰かをなぞるためではなく、声、距離感、記憶、反応の癖を持つ original persona を安定させるために使います。

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

Life Mentor は公開文章、インタビュー、個人ノート、意思決定記録、原則を、対話できる思考の伴走モデルにします。推論の癖、言葉の選び方、判断の型、迷ったときの tradeoffs を、根拠つきで取り出します。

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

public figures や celebrities は、公開資料だけで作る Life Mentor model と相性があります。インタビュー、記事、発表、メモを集めると、product judgment、writing、choices、tradeoffs を、資料に基づいて質問できます。

## Persona Pack

persona pack は最後に残る持ち出し用の人格フォルダです。声、記憶、資料、判断の根拠を同じ場所に置くので、あとから見直しても何をもとに作られたか分かります。

```text
persona.yaml          structured persona pack
persona.md            readable persona description
sources/              imported material
memory/               episodes, corrections, lorebook
distillation/         evidence, claims, contradictions, runs
exports/              target-specific files
```

Prompt Stack は、中身を黒箱にしないための分解図です。

```text
identity       role, voice, expression DNA
mental_models  Life Mentor or character reasoning models
memory         profile facts, relationship facts, episodes
rhythm         relationship pacing, tone, reply feel, conversation texture
export layer   target platform format
```

## GUI

まず GUI で触るのがいちばん分かりやすいです。ローカルで起動し、素材を入れ、preview を見てから pack にします。

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

開発者、バッチ処理、自動化では CLI が使えます。ここにあるコマンドは package scripts と実装済みコマンドに合わせています。

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

ひとつの persona pack を、使う場所に合わせた形式へ export できます。

| Target | Files | How to use |
|---|---|---|
| Skill folder | `SKILL.md`, `references/persona.md`, `references/memory.md`, `references/evidence.json` | local skills path に置く |
| Instruction bundle | `instructions.md`, `knowledge/`, config JSON | chat persona の instructions と knowledge として使う |
| API context | `system-prompt.json`, `api-request.json` | system context または request template として使う |
| Character card | character card JSON, lorebook JSON | card と lorebook を読める環境へ import |
| Soul archive | `SOUL.md`, `skills/` | `SOUL.md` を primary identity として使う |
| Agent JSON | agent / model JSON | JSON config を読める local / self-hosted 環境へ import |

```bash
npm run check:exports
```

## Privacy And Feel

K.skill is local-first. Private chats stay outside the repository. 外部 provider を明示的に設定しない限り、素材は自分のマシンに残ります。

K.skill が得意なこと:

- chat の空気を読む
- relationship memory を整理する
- 夢の中の人物や original character を形にする
- Virtual Persona や Movie Character の世界を保つ
- public material を Life Mentor にする
- 同じ pack をよく使う persona format に export する
- evidence と confidence を見える形にする

判断はなるべく根拠と一緒に表示します。なぜその返信なのか、なぜ今は待つのか、どの資料からその Life Mentor の考え方を取ったのかを、あとから追えるようにするためです。

## Development And Verification

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

`npm run verify` runs the fixed local quality chain above, including build, exports, README checks, e2e, smoke, scoring, and a package dry-run. README checks enforce five languages, images, commands, targets, Life Mentor naming, product concepts, and K.skill-only positioning.

## License

Apache-2.0
