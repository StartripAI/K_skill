<div align="center">

# K.skill

![K.skill film voice memory hero](assets/readme/hero-voice-memory-film-v3.png)

**把一个人的声音、聊天、照片、表情和共同经历，整理成可以继续打开的 persona pack。**<br>
**A voice-first place to keep chats, memories, characters, and Life Mentor packs alive locally.**

**中文** · [English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

有些人、有些角色、有些关系，不是几句简介能装下的。
TA 的语音会有停顿，聊天里会有只属于你们的梗，照片和表情会留下当时的气氛，很多共同经历也散在截图、笔记、PDF、视频字幕和零碎回忆里。

K.skill 做的事，就是把这些材料整理成一份可以再次打开的 persona pack：能看见证据，能继续聊天，能带着声音、关系节奏、角色设定和 Prompt Stack 一起导出。它默认在本地跑，适合把私人的聊天、原创角色、公开资料里的思路，整理成你以后还拿得起来的 AI 人格包。

## Voice Memory：把声音也放进人格里

![K.skill voice memory scene](assets/readme/voice-memory-anime-v3.png)

很多时候，让人一下子想起来的不是那句话本身，而是那句话的声音。<br>
一句尾音、一次笑、慢半拍的回复、某个习惯性口头禅，都会比普通文字更快把“这个人是谁”带回来。原创角色也是一样：声音节奏一对，角色就不再只是设定表。

K.skill 把 Voice Memory 放在整个体验的第一层。语音先变成可检查的 transcript，再沉淀成 voice DNA、聊天节奏、关系记忆、角色语气和可导出的包。你可以从一条 voice note 开始，也可以把声音和聊天、图片、表情、PDF、视频字幕一起放进来，让 persona pack 既有事实，也有感觉。

| 你想做什么 | 你放进去什么 | K.skill 给你什么 |
|---|---|---|
| 想把某个人留在可回看的地方 | voice note、旧聊天、照片、共同经历 | voice DNA、关系记忆、聊天节奏、能继续打开的 persona pack |
| 想让梦里或脑内的角色成形 | 一段描述、角色图、台词音频、世界观 | 有声音感、能接话、能延展剧情的原创角色 |
| 想重新整理一段关系 | 旧语音、截图、时间线、补充记忆 | 能翻、能听、能复盘的 Relationship Memory |
| TA 发来一条语音，你不知道怎么接 | TA 的 voice note、最近聊天、你的目标 | ASR 转写、语气判断、热度信号、3 条可改的回复 |
| 想做电影人物 / 虚拟人物 | 角色图、台词、音色素材、场景卡 | voice profile、visual style、sticker intents、完整导出包 |

你可以先用内置样例跑通，再接自己的本地语音引擎：

```bash
# 1. 语音转文字：默认 stub 离线可跑，换 provider 后接真实 ASR
npm run cli -- transcribe tests/fixtures/media/voice-note-zh.wav --provider stub-asr --language zh --out tmp/transcript.json

# 2. 把语音作为 persona evidence 导入
npm run cli -- import tests/fixtures/media/voice-note-zh.wav --type pursuit --media --provider stub-asr --pack local-packs/voice-crush

# 3. 生成可听的 voice preview：默认 stub 可跑；配置本地 voice engine 后输出真实音频
npm run cli -- speak local-packs/voice-crush --text "周末去看展，语气轻一点。" --provider stub-tts --out tmp/voice-preview.wav

# 4. 接本地语音克隆 / 合成引擎
KSKILL_LOCAL_TTS_COMMAND="node examples/local-voice-engine.mjs" \
  npm run cli -- speak local-packs/voice-crush \
  --text "我还记得你说这句话的语气。" \
  --provider local-voice-clone \
  --reference-audio tests/fixtures/media/voice-note-zh.wav \
  --out tmp/memory-voice.wav
```

`local-voice-clone` 的边界很清楚：K.skill 负责把 persona 里的文本、语言、voice profile 和 reference audio 交给你的本地语音引擎；本地引擎负责生成音频；K.skill 再把结果放回 GUI、CLI 和导出包。这样声音可以进入体验，但你仍然能检查每一步从哪里来。

把 K.skill 想成五个清楚的功能边界，再叠加不同场景：

| 功能边界 | 你丢进去 | K.skill 给你什么 |
|---|---|---|
| **Voice Memory** | 语音、录音、voice note、声音素材 | ASR transcript、voice DNA、TTS preview、能放进人格包的声音记忆 |
| **Crush Coach** | 你和 TA 的聊天记录、最近一条消息、你的目标 | 聊天节奏、热度信号、风险信号、3 条像你本人会发的回复 |
| **Relationship Memory** | 恋人、朋友、前任、长期互动里的聊天和共同经历 | 关系时间线、称呼习惯、共同记忆、可持续更新的关系上下文 |
| **Character World** | 原创角色、动漫 OC、电影人物、NPC、世界观 | 角色身份、说话方式、lorebook、Prompt Stack、可导出角色包 |
| **Life Mentor** | 公开文章、访谈、演讲、原则、你自己的决策笔记 | 表达习惯、mental models、heuristics、evidence / confidence、可追问的思考陪跑 |

README 里写到的命令、例子和导出流程，都对应仓库里的真实文件和检查。你可以先用样例把感觉跑通，再换成自己的材料。

## 先看 6 个场景

![K.skill six social persona scenes](assets/readme/persona-scenes-social-v3.png)

K.skill 不是只给你一个空聊天框。它更像一个可以反复打开的私人记忆空间：有些入口用来处理当下的消息，有些入口用来收纳长期关系，有些入口用来把脑内角色变成可互动的世界。

- 想追 TA：先读聊天节奏，看现在该接话、推进、换话题，还是体面收住。
- 想复盘一段关系：把聊天、照片、语音和共同记忆整理成长期上下文。
- 想和动漫 OC 聊：把角色设定、世界观、语气和 lorebook 做成可导出角色包。
- 想做电影人物：把剧本片段、人物弧线和场景记忆变成能说话的虚拟角色。
- 想做虚拟人格：为 AI companion、虚拟主播、NPC、产品角色准备稳定人格。
- 想和公开资料里的思路对话：用文章、访谈、原则做 Life Mentor，拿来拆产品、创业、写作和选择。

这里的 Life Mentor 可以理解成“公开资料和个人笔记整理出来的思考陪跑”。比如你想研究某位创业者公开表达里的产品判断、发布节奏和取舍习惯，K.skill 会把来源、判断和置信度放在一起，让你能追问，也能回看它为什么这么说。

## 你最可能先用哪个

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

如果你现在最急的是“TA 刚回我了，我该怎么回”，直接用 **Crush Coach / 我要追TA**。它不是帮你装成另一个人，而是把聊天里已经出现的温度、节奏和边界读出来，再给你几条更像你自己的回复草稿。

它会看四件事：

| 它看什么 | 人话解释 |
|---|---|
| 关系阶段 | 现在是刚认识、能聊、暧昧、冷掉、还是有风险 |
| 热度信号 | TA 有没有主动问你、接梗、展开话题 |
| 风险信号 | TA 是不是变冷、回得短、压力变大、想收住 |
| 下一步 | 继续聊、换话题、轻轻邀约、暂停、道歉、收尾 |

例子：

```text
TA: 周末可能去，你也喜欢这种展吗？

K.skill 读出来：
- 这不是冷场，TA 在反问你
- 展览是一个能继续聊的话题
- 可以轻轻推进，但别一上来压迫式邀约

稳妥版：
这个我有点被种草了。你说的那个展听起来挺有画面感，哪一部分最适合新手先看？

轻松版：
感觉你讲这个展的时候明显更有精神哈哈。我先记一笔，下次别嫌我问题多。

稍微推进版：
那我认真提个低压力方案：哪天你刚好想去，可以叫我，我负责不乱发表外行感想。
```

它的重点不是套路，而是帮你把话说得自然一点、轻一点、像你本人一点。  
如果气氛已经明显变冷，它会建议你体面收住，让对话留点余地；如果窗口还在，它会帮你把下一句放在舒服的位置。

## 四个主工作流

K.skill 的主工作流是四条线，Voice Memory 是可以叠加在四条线上的声音层。选之前先看边界，目的清楚，后面导入和导出都会更顺。

| 边界 | 它负责什么 | 最适合的打开方式 |
|---|---|---|
| **Voice Memory** | 让声音进入 persona pack：ASR、voice DNA、TTS preview、声音证据 | 给其他工作流补上声音感，也可以单独做 voice profile |
| **Crush Coach / 我要追TA** | 读聊天节奏、写回复、判断下一步 | 看 evidence、confidence 和几条可选回复，再按你的语气改 |
| **Relationship Memory / 关系记忆** | 整理恋人、朋友、前任、亲密关系里的共同记忆和长期上下文 | 像维护关系相册一样，持续修正和补充 |
| **Character World / 角色与世界观** | 做动漫角色、电影人物、虚拟人物、NPC、世界观和 lorebook | 把身份、规则、记忆、语气一起放进角色包 |
| **Life Mentor / 人生陪跑模型** | 把公开资料、文章、访谈、原则和笔记提炼成可追问的思考模型 | 追问来源、判断方式、evidence 和 confidence |

## Voice Studio：聊天、语音、图片、表情放在一个入口

真实材料从来不是整整齐齐的一份文档。聊天截图混着语音，照片旁边有一句没说完的话，表情包有时比文字更能说明关系。
所以 Voice Studio 允许你把 **voice note**、录音、语音消息、screenshot、image、图片、sticker、emoji、PDF、视频字幕和混合 ZIP 放进同一个入口。

它会先做 **multimodal import**：文字进聊天流，语音走 **ASR** 生成 transcript，image / screenshot / PDF / video transcript 生成可检查的 media evidence，表情包整理成 **sticker intents**。后面不管你做 Crush Coach、Relationship Memory、Character World 还是 Life Mentor，这些证据都会继续跟着 persona pack 走。

CLI：

```bash
npm run cli -- transcribe tests/fixtures/media/voice-note-zh.wav --provider stub-asr --language zh --out tmp/transcript.json
npm run cli -- import tests/fixtures/media/voice-note-zh.wav --type pursuit --media --provider stub-asr --pack local-packs/voice-crush
npm run cli -- speak local-packs/voice-crush --text "周末去看展，语气轻一点。" --provider stub-tts --out tmp/voice-preview.wav
npm run cli -- voice-profile local-packs/voice-crush
```

GUI：

1. `DM intake` 里可以选 `Files / Paste / Record / Media`。
2. 上传聊天记录、语音、截图、sticker、PDF、视频字幕或 ZIP。
3. `Record` 可以录一段 voice note，转写后自动填进 Reply Lab。
4. `Parse preview` 会显示 message、asset、transcript、reaction 和 attachment kind。
5. 右侧 `Persona Voice` 会展示 voice DNA、TTS preview 和 sticker intents，导出 ZIP 时一起带走。

一句话理解功能边界：

- **Voice Memory**：让声音、转写、voice DNA 和 TTS preview 进入人格包。
- **Crush Coach**：帮你读聊天节奏，把下一句回自然。
- **Relationship Memory**：帮你把一段关系整理成长期可回看的上下文。
- **Character World**：帮你把角色、世界观、记忆和语气做成可互动人格。
- **Life Mentor**：帮你把公开资料和个人笔记提炼成可追问的思考陪跑。

## 我要追TA：先把这条消息回好

Crush Coach 适合那种很具体的时刻：消息已经来了，你想回得自然一点，不想太急，也不想把话题放掉。
你可以上传聊天软件导出的记录，也可以直接粘贴最近几轮对话。K.skill 会把热度、风险、可继续的话题、适合的推进力度放在一份 pursuit report 里。

GUI 怎么用：

1. 启动本地界面。
2. 选 `Crush Coach`。
3. 上传聊天记录，或者粘贴最近聊天。
4. 填你是谁、TA 是谁。
5. 选目标：想破冰、想续聊、想约出来、想判断有没有机会、想救冷场、想写一条现在能发的回复。
6. 点 `Run lab`。
7. 看报告、回复建议、话题计划。

命令行也能跑：

```bash
npm run cli -- pursue examples/crush-chat-zh.txt --me 我 --ta TA --goal ask_out --out tmp/pursuit-zh
npm run cli -- reply examples/crush-chat-zh.txt --latest "周末可能去 你也喜欢这种吗？" --me 我 --ta TA --style natural
npm run cli -- topics examples/crush-chat-zh.txt --me 我 --ta TA
npm run cli -- send-or-not examples/crush-chat-zh.txt --draft "那我们周末一起去吧？" --latest "周末可能去 你也喜欢这种吗？"
```

已经准备好的例子：

```text
examples/crush-chat-zh.txt       中文暧昧推进
examples/crush-chat-en.txt       英文自然续聊
examples/cold-chat-zh.txt        冷场续聊，判断要不要停
```

输出文件：

```text
tmp/pursuit-zh/
  pursuit_report.md
  pursuit_report.json
  topic_plan.md
```

报告里会写 `evidence` 和 `confidence`。  
也就是：它为什么这么判断，确定度有多高。证据薄的时候，它会把不确定性留在台面上，方便你自己拿捏分寸。

## Relationship Memory：关系记忆

![K.skill relationship memory](assets/readme/relationship-memory-chat.png)

Relationship Memory 更像一只可以慢慢补齐的关系相册，只是它不只保存照片，也保存称呼、说话习惯、重要事件、共同经历和聊天氛围。
它适合把散落在聊天记录、语音、截图和补充笔记里的关系线索，整理成一个可以检查、可以修正、可以继续用的记忆包。

适合这些情况：

- 想复盘一段关系。
- 想整理恋人或朋友之间的共同记忆。
- 想把小说、游戏、互动叙事里的长期关系保存下来。
- 想避免 AI 胡编关系细节。

GUI 怎么用：

1. 选 `Relationship`。
2. 上传 `examples/relationship-memory-chat.txt` 或你自己的资料。
3. 看 preview，确认说话人和消息数。
4. 保存到本地 vault。
5. 看 memory 和 Prompt Stack。
6. 需要就导出成 zip。

CLI：

```bash
npm run cli -- init "Rain Bookstore Memory" --type relationship --language zh --out local-packs/rain-bookstore
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/rain-bookstore
npm run cli -- memory local-packs/rain-bookstore
npm run cli -- inspect local-packs/rain-bookstore
```

它会整理出这些东西：

- 共同事件：比如雨天书店、遗落的伞。
- 说话习惯：谁更爱讲细节，谁更克制，谁喜欢用什么称呼。
- 关系偏好：比如“自然一点，不要太戏剧化”。
- 氛围：哪些话适合轻轻带过，哪些记忆适合慢慢展开。

## Character World：动漫角色、虚拟人物、世界观

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World 给创作者、角色党、跑团作者、游戏作者和虚拟人物爱好者用。
你可以把原创角色、二次元 OC、世界观 Markdown、角色卡、lorebook、台词样本和语气备注放进去，让角色不只停留在设定图上。

它不是只学一句口癖。它会一起整理：

- 角色是谁，和谁有关系。
- 说话是什么节奏，情绪怎么收放。
- 世界观规则是什么，哪些设定不能乱。
- 哪些记忆会被触发，哪些信息只在特定场景出现。
- 角色稳定感怎么保持，导出到不同工具时怎么不散。

CLI：

```bash
npm run cli -- init "Rain Archive" --type character --language zh --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
npm run cli -- inspect local-packs/rain-archive
```

输出：

- `persona.yaml`：结构化角色包。
- `persona.md`：人能读懂的人格说明。
- `memory.lorebook`：世界观触发记忆。
- `Prompt Stack`：把身份、记忆、风格拆开给你看。
- 可导出到多个 AI 工具。

## Movie Character：电影人物

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character 是 Character World 里更偏影视感的一条用法。
如果你手里有剧本片段、人物小传、关键场景、人物弧线和台词风格，K.skill 可以把它整理成一个可聊天的虚拟电影角色。

你可以把它理解成“剧本角色的聊天版本”：不是把台词堆在一起，而是把人物的选择方式、场景记忆、关系张力和说话节奏放进同一个角色包。

CLI：

```bash
npm run cli -- init "Mira Vale" --type character --language en --out local-packs/mira-vale
npm run cli -- import examples/movie-character.md --type character --pack local-packs/mira-vale
npm run cli -- compile local-packs/mira-vale --target sillytavern --out local-packs/mira-vale/exports/sillytavern
npm run cli -- export-zip local-packs/mira-vale --target chatgpt --out local-packs/mira-vale/exports/chatgpt.zip
```

适合上传：

- 剧本片段。
- 角色小传。
- 场景卡。
- 台词样本。
- 人物关系图文字版。
- 公版或授权素材。

得到：

- 角色身份。
- 人物弧线。
- 关键场景记忆。
- 台词节奏。
- 角色资料来源和使用说明。
- 角色卡和 lorebook。

## Virtual Persona：虚拟人物人格

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

Virtual Persona 适合从零搭一个原创人格，让它有名字、有语气、有记忆边界，也能导出到你常用的聊天工具。它适合做：

- AI companion。
- 虚拟主播人格。
- 游戏 NPC。
- 社交头像人格。
- 品牌或产品角色。
- 卡通人物对话。

它和 Relationship Memory 的区别很简单：Relationship Memory 是把已经发生过的关系整理清楚；Virtual Persona 是做一个原创虚拟人格，让它从一开始就有稳定的身份、表达和互动方式。

GUI：

1. 选 `Character`。
2. 上传角色设定或粘贴 persona brief。
3. 看 preview。
4. 保存并蒸馏。
5. 检查 Prompt Stack。
6. 导出到你要用的工具。

CLI：

```bash
npm run cli -- init "Nova Social" --type character --language zh --out local-packs/nova-social
npm run cli -- import examples/character-world.md --type character --pack local-packs/nova-social
npm run cli -- compile local-packs/nova-social --target lobe --out local-packs/nova-social/exports/lobe
```

## Life Mentor：人生陪跑模型

![K.skill life mentor model](assets/readme/life-mentor-model.png)

Life Mentor 适合把公开文章、访谈、演讲、笔记、原则整理成一套能追问、能复盘、能帮你拆选择的思考方式。
它更像一个放在身边的思路书架：你可以把材料交给它，再问“这个问题按这些原则会怎么拆”“这一步风险在哪里”“我是不是漏掉了反例”。

比如：

- 某个创业者公开表达里的产品判断。
- 某个作者公开文章里的写作原则。
- 你自己的决策笔记。
- 一个团队内部的做事方法。

如果你想做某位创业者风格的公开资料对话，可以把公开访谈、文章、发布会内容整理进去。最后得到的不是冷冰冰的资料摘要，而是一个可以继续追问的 Life Mentor：产品怎么取舍、目标怎么拆、风险怎么看、下一步怎么判断。

CLI：

```bash
npm run cli -- init "Decision Life Mentor" --type advisor --language en --out local-packs/decision-life-mentor
npm run cli -- import examples/life-mentor-source.md --type advisor --pack local-packs/decision-life-mentor
npm run cli -- distill local-packs/decision-life-mentor
npm run cli -- inspect local-packs/decision-life-mentor
```

它会提炼：

- expression DNA：这个资料里的表达习惯。
- mental models：常用判断模型。
- heuristics：能直接执行的原则。
- anti-patterns：容易踩坑的反模式。
- contradictions：资料里互相冲突的地方。
- evidence / confidence：每条判断的证据和置信度。

## Persona Pack 到底是什么

K.skill 最后会生成一个 persona pack。  
你可以把它理解成“可搬走的人格文件夹”：里面有来源、有记忆、有可读说明，也有给不同平台准备好的导出格式。
用工程边界说，它也是一个本地人格工作台：不是把资料揉成一段提示词，而是用一套 AI 人格系统把 sources、memory、voice DNA、evidence 和 Prompt Stack 连在一起。

```text
persona.yaml          机器能读的结构化人格包
persona.md            人能读的人格说明
sources/              你导入的资料
memory/               记忆、修正、lorebook
distillation/         evidence、claims、contradictions
exports/              导出到不同工具的文件
```

Prompt Stack 是用来检查和整理的。
它会把人格拆成几层，让你知道这个 persona 为什么这样说话、记住了什么、哪些判断来自哪些材料：

```text
identity       这个人格是谁，怎么说话
mental_models  Life Mentor 或角色的判断方式
memory         事实、关系、事件
rhythm         关系节奏、表达分寸、聊天氛围
export layer   不同平台要用的格式
```

## GUI 怎么用

普通用户可以先从 GUI 开始：把材料放进去，看 preview，确认解析没跑偏，再决定要做 Crush Coach、Relationship Memory、Character World 还是 Life Mentor。

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

打开终端里的地址，一般是：

```text
http://127.0.0.1:5999
```

常见流程：

1. 选工作流：Crush Coach、Relationship Memory、Character World、Life Mentor。
2. 填 pack name 和语言。
3. 上传文件，或者粘贴资料。
4. 勾选 consent / privacy。
5. 看解析预览。
6. 如果是 Crush Coach，点 `Run lab`。
7. 下载 report。
8. 选择导出目标，下载 zip。

本地 API 也有：

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

## CLI 怎么用

开发者、批处理、自动化，用 CLI 更快。它适合把同一套 persona pack 流程放进脚本里：初始化、导入、蒸馏、检查、评估、导出。

```bash
npm run cli -- --help
npm run cli -- init "My Pack" --type relationship --language zh --out local-packs/my-pack
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/my-pack
npm run cli -- distill local-packs/my-pack
npm run cli -- inspect local-packs/my-pack
npm run cli -- memory local-packs/my-pack
npm run cli -- eval local-packs/my-pack
```

Crush Coach：

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/cold-chat-zh.txt --me 我 --ta TA
npm run cli -- send-or-not examples/crush-chat-en.txt --draft "Want to go together this weekend?" --latest "Maybe, I might go this weekend."
```

导出：

```bash
npm run cli -- compile local-packs/my-pack --target codex --out local-packs/my-pack/exports/codex
npm run cli -- export-zip local-packs/my-pack --target sillytavern --out local-packs/my-pack/exports/sillytavern.zip
```

## 导出到真实工具

![K.skill export matrix](assets/readme/export-matrix.png)

一份 persona pack 不应该困在一个界面里。K.skill 会把同一份身份、记忆、证据和 Prompt Stack 转成不同工具能吃的格式。

| 目标 | 生成什么 | 怎么用 |
|---|---|---|
| 技能目录 | `SKILL.md`、`references/` | 放到你的本地技能目录 |
| 指令包 | `instructions.md`、`knowledge/`、配置 JSON | 用作聊天人格的 instructions 和知识材料 |
| API 上下文 | `system-prompt.json`、`api-request.json` | 放进自己的请求模板或 system context |
| 角色卡 | character card JSON、lorebook JSON | 导入支持角色卡和 lorebook 的聊天环境 |
| 灵魂档案 | `SOUL.md`、`skills/` | 把 `SOUL.md` 当作主身份文件 |
| Agent JSON | agent / model JSON | 导入支持 JSON 配置的本地或自托管环境 |

检查导出：

```bash
npm run check:exports
```

## 隐私和使用感

本项目默认本地运行。私人聊天记录不会进入仓库。
除非你自己配置外部模型 provider，否则资料不会主动发到第三方模型。你可以先用 stub ASR / stub TTS 和本地样例跑完整流程，再决定要不要接自己的语音或模型服务。

K.skill 的使用感更接近“整理一份能继续打开的关系 / 角色 / 思考档案”，而不是一次性问答。它更适合做这几件事：

```text
帮你读聊天氛围
帮你整理关系记忆
帮你做原创角色
帮你把公开资料变成 Life Mentor
帮你导出成常用人格包格式
```

它会尽量把判断说清楚：证据是什么、置信度多少、下一步为什么这样建议。这样你不是盲发，而是带着上下文、聊天节奏和自己的判断往前走。

## 开发与验证

安装：

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
```

开发：

```bash
npm run dev
npm run cli -- --help
```

质量门禁：

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

`npm run verify` 会按固定顺序跑完 lint、test、build、导出检查、README 检查、GUI e2e、smoke、发布前评分和打包预演。

README 检查会确认：5 种语言、图片、命令、导出流程、Life Mentor 命名、使用说明、没有外部对比话术。

## 许可证

Apache-2.0
