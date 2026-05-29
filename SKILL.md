---
name: kskill
description: >-
  把一个人(或一个原创角色)的声音、聊天、照片、表情和共同经历，打包成一个能继续打开的、完全本地的「人格包」(persona pack)。
  Voice-first：声音先转成可检查的 transcript，再沉淀成 voice DNA、聊天节奏、关系记忆、角色语气，最后导出完整的包。
  A voice-first place to keep chats, memories, characters, and Life Mentor packs alive locally.
  适用场景 / Use when: 看聊天节奏并写出更像你自己的回复(Crush Coach / 我要追TA)、复盘并留存一段关系(Relationship Memory)、
  让原创/动漫/电影角色带着声音开口(Character World)、把公开资料变成可追问的思考陪跑(Life Mentor)、
  把语音备忘录+截图+表情+PDF+视频字幕变成既有事实也有感觉的人格(Voice Memory / Voice Studio)。
  支持 🇨🇳中文 · 🇬🇧English · 🇯🇵日本語 · 🇰🇷한국어 · 🇪🇸Español。
  触发词 / triggers: 人格包, persona pack, 声音记忆, voice memory, 追TA怎么回, TA刚回我, crush coach, 关系复盘,
  relationship memory, 原创角色, 动漫OC, 电影人物, character world, life mentor, 思考陪跑, voice studio, 导出角色卡.
---

# K.skill

把一个人的声音、聊天、照片、表情和共同经历，打包成一个能继续打开的「人格包」。
A voice-first place to keep chats, memories, characters, and Life Mentor packs alive locally.

支持语言：🇨🇳 中文 · 🇬🇧 English · 🇯🇵 日本語 · 🇰🇷 한국어 · 🇪🇸 Español

## 🎙️ 它不是那种"几句简介就完事"的工具

有些人、有些角色、有些关系，不是几句话能装下的。
TA 的语音里会有停顿，聊天里有只有你俩懂的梗，照片和表情藏着当时的气氛，还有很多共同经历散落在截图、笔记、PDF、视频字幕里……

**K.skill = 你的私人记忆房间。**
你把材料丢进来，它把来源、声音、关系节奏、角色设定 + Prompt Stack 全收进同一个 persona pack。
以后再打开，你不只看到一段简介——你能听见声音的影子、看见判断的来处，还能继续聊下去 💬

## 🔊 Voice Memory：把声音也放进人格里

很多时候，让人一下子想起来的不是那句话本身，而是那句话的声音。
一个尾音、一次笑、慢半拍的回复、某个口头禅——都比文字更快地唤醒"这个人是谁"。

原创角色也一样：声音节奏一对，角色就不再只是设定表。

K.skill 把 Voice Memory 放在体验的第一层 👇

1. 语音先转成可检查的 **transcript**
2. 再沉淀成 **voice DNA、聊天节奏、关系记忆、角色语气**
3. 最后导出一个完整的包

你可以从一条语音备忘录开始，也可以把声音 + 聊天 + 图片 + 表情 + PDF + 视频字幕一起扔进来，让 persona pack 既有事实，也有感觉 ✨

## 📋 一张表看懂：你想做什么 → 放什么 → 得到什么

| 你想做啥 | 你放进去啥 | K.skill 给你啥 |
| --- | --- | --- |
| 把某个人留在可回看的地方 | 语音、旧聊天、照片、共同经历 | voice DNA、关系记忆、聊天节奏、能继续打开的人格包 |
| 让梦里/脑内的角色成形 | 一段描述、角色图、台词音频、世界观 | 有声音感、能接话、能延展剧情的原创角色 |
| 重新整理一段关系 | 旧语音、截图、时间线、补充记忆 | 能翻、能听、能复盘的关系记忆 |
| TA 发来一条语音，你不知道怎么回 | TA 的语音、最近聊天、你的目标 | ASR 转写、语气判断、热度信号、3 条可改的回复 |
| 做电影人物/虚拟角色 | 角色图、台词、音色素材、场景卡 | voice profile、visual style、sticker intents、完整导出包 |

## 🛠️ 先用内置样例跑通，再接你自己的语音引擎

```bash
# 1. 语音转文字（默认 stub 离线可跑）
npm run cli -- transcribe tests/fixtures/media/voice-note-zh.wav --provider stub-asr --language zh --out tmp/transcript.json

# 2. 把语音作为人格证据导入
npm run cli -- import tests/fixtures/media/voice-note-zh.wav --type pursuit --media --provider stub-asr --pack local-packs/voice-crush

# 3. 生成可听的语音预览
npm run cli -- speak local-packs/voice-crush --text "周末去看展，语气轻一点。" --provider stub-tts --out tmp/voice-preview.wav

# 4. 接本地语音克隆/合成引擎
KSKILL_LOCAL_TTS_COMMAND="node examples/local-voice-engine.mjs" \
  npm run cli -- speak local-packs/voice-crush \
  --text "我还记得你说这句话的语气。" \
  --provider local-voice-clone \
  --reference-audio tests/fixtures/media/voice-note-zh.wav \
  --out tmp/memory-voice.wav
```

⚠️ 边界很清楚：K.skill 负责把文本、语言、voice profile 交给你的本地引擎，引擎生成音频，K.skill 再把它放回 GUI / CLI / 导出包。声音能进体验，但每一步你都能检查来源 👌

## 🚪 五个入口，五种关系感

| 入口 | 你放进去啥 | 会留下什么 |
| --- | --- | --- |
| 🎙️ Voice Memory | 语音、录音、声音素材 | ASR transcript、voice DNA、TTS preview、能放进人格包的声音记忆 |
| 💘 Crush Coach / 我要追TA | 你和 TA 的聊天记录、最近一条消息、你的目标 | 聊天节奏、热度信号、风险信号、3 条像你本人会发的回复 |
| 💞 Relationship Memory | 恋人/朋友/前任的聊天和共同经历 | 关系时间线、称呼习惯、共同记忆、可持续更新的关系上下文 |
| 🌍 Character World | 原创角色、动漫 OC、电影人物、NPC、世界观 | 角色身份、说话方式、lorebook、Prompt Stack、可导出角色包 |
| 🧠 Life Mentor | 公开文章、访谈、演讲、原则、你的决策笔记 | 表达习惯、思维模型、启发式规则、证据/置信度、可追问的思考陪跑 |

你可以先用样例听一遍它怎么处理声音、关系和角色，再换成自己的材料～

## 🎬 先看 6 个真实场景

K.skill 不是只给你一个空聊天框。它更像一个可以反复打开的私人记忆空间：

- 💘 **想追 TA**：先读聊天节奏，看现在该接话、推进、换话题，还是体面收住
- 📖 **想复盘一段关系**：把聊天、照片、语音和共同记忆整理成长期上下文
- 🌸 **想和动漫 OC 聊**：把角色设定、世界观、语气和 lorebook 做成可导出角色包
- 🎭 **想做电影人物**：把剧本片段、人物弧线、场景记忆变成能说话的虚拟角色
- 🤖 **想做虚拟人格**：为 AI 伴侣、虚拟主播、NPC、产品角色准备稳定人格
- 📚 **想和公开资料里的思路对话**：用文章、访谈、原则做 Life Mentor，拿来拆产品、创业、写作、选择

**Life Mentor = 公开资料 + 个人笔记整理出来的思考陪跑。**
比如你想研究某位创业者的产品判断、发布节奏、取舍习惯，K.skill 会把来源、判断、置信度放在一起，让你能追问，也能回看它为什么这么说 💡

## ❤️ 你最可能先用哪个？——"TA 刚回我了，我该怎么回"

如果你现在最急的是这个，直接冲 **Crush Coach / 我要追TA**！
它不是帮你装成另一个人，而是把聊天里已经出现的温度、节奏、边界读出来，再给你几条更像你自己的回复草稿。

它看这四件事 👇

| 看什么 | 人话解释 |
| --- | --- |
| 关系阶段 | 刚认识 / 能聊 / 暧昧 / 冷掉 / 有风险 |
| 热度信号 | TA 有没有主动问你、接梗、展开话题 |
| 风险信号 | TA 是不是变冷、回得短、压力变大、想收住 |
| 下一步 | 继续聊 / 换话题 / 轻轻邀约 / 暂停 / 道歉 / 收尾 |

举个栗子 🌰

> TA：周末可能去，你也喜欢这种展吗？

K.skill 读出来：

- 这不是冷场，TA 在反问你
- 展览是一个能继续聊的话题
- 可以轻轻推进，但别一上来压迫式邀约

✏️ **稳妥版**：
> 这个我有点被种草了。你说的那个展听起来挺有画面感，哪一部分最适合新手先看？

😄 **轻松版**：
> 感觉你讲这个展的时候明显更有精神哈哈。我先记一笔，下次别嫌我问题多。

🔥 **稍微推进版**：
> 那我认真提个低压力方案：哪天你刚好想去，可以叫我，我负责不乱发表外行感想。

重点不是套路，而是帮你把话说得自然一点、轻一点、像你本人一点。
如果气氛已经明显变冷，它会建议你体面收住；如果窗口还在，它会帮你把下一句放在舒服的位置。

## 🧭 四个主工作流（一张表看懂）

| 入口 | 它负责什么 | 适合怎么打开 |
| --- | --- | --- |
| 🎙️ Voice Memory | 让声音进入人格包：ASR、voice DNA、TTS preview、声音证据 | 给其他工作流补上声音感，也可以单独做 voice profile |
| 💘 Crush Coach | 读聊天节奏、写回复、判断下一步 | 看 evidence、confidence 和几条可选回复，再按你的语气改 |
| 💞 Relationship Memory | 整理恋人/朋友/亲密关系里的共同记忆和长期上下文 | 像维护关系相册一样，持续修正和补充 |
| 🌍 Character World | 做动漫角色、电影人物、虚拟人物、NPC、世界观和 lorebook | 把身份、规则、记忆、语气一起放进角色包 |
| 🧠 Life Mentor | 把公开资料、文章、访谈、原则和笔记提炼成可追问的思考模型 | 追问来源、判断方式、evidence 和 confidence |

## 🎨 Voice Studio：聊天 + 语音 + 图片 + 表情放一个入口

真实材料从来不是整整齐齐的一份文档。
聊天截图混着语音，照片旁边有一句没说完的话，表情包有时比文字更能说明关系。

所以 Voice Studio 允许你把：

- voice note / 录音 / 语音消息
- screenshot / image / 图片
- sticker / emoji
- PDF / 视频字幕 / 混合 ZIP

全扔进同一个入口 🎉

它会先做**多模态导入**：

- 文字 → 聊天流
- 语音 → ASR 生成 transcript
- 图片/截图/PDF/视频字幕 → 可检查的 media evidence
- 表情包 → 整理成 sticker intents

后面不管你做 Crush Coach、Relationship Memory、Character World 还是 Life Mentor，这些证据都会继续跟着 persona pack 走。

## 📹 会说话的人像视频

只用一张照片加一段语音，就能在自己的电脑上生成一小段会说话的人像视频。Voice Studio 合成出来的语音会驱动照片里的人像，结果是一个独立的 MP4，既能直接回放，也能放进 persona pack 里带走。内置的渲染器只要电脑装了视频处理工具，就能在任何机器上产出真实可看的片段，不需要独立显卡；当你的硬件支持时，也可以在本地接入精度更高的人像口型模型。

## 🖥️ GUI 怎么用？（小白友好）

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

打开终端里的地址：`http://127.0.0.1:5999`

常见流程：

1. 选工作流：Crush Coach / Relationship Memory / Character World / Life Mentor
2. 填 pack name 和语言
3. 上传文件或粘贴资料
4. 勾选同意 / 隐私
5. 看解析预览
6. 如果是 Crush Coach，点 Run lab
7. 下载报告
8. 选择导出目标，下载 zip

## ⌨️ CLI 怎么用？（开发者/批处理狂魔）

```bash
npm run cli -- --help
npm run cli -- init "My Pack" --type relationship --language zh --out local-packs/my-pack
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/my-pack
npm run cli -- distill local-packs/my-pack
npm run cli -- inspect local-packs/my-pack
npm run cli -- memory local-packs/my-pack
npm run cli -- eval local-packs/my-pack
```

Crush Coach 专用：

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

## 📦 导出到真实工具

一份 persona pack 不应该困在一个界面里。
K.skill 会把同一份身份、记忆、证据和 Prompt Stack 转成你能继续带走的格式：

| 目标 | 生成什么 | 怎么用 |
| --- | --- | --- |
| 技能目录 | `SKILL.md`、`references/` | 放到你的本地技能目录 |
| 指令包 | `instructions.md`、`knowledge/`、配置 JSON | 用作聊天人格的 instructions 和知识材料 |
| API 上下文 | `system-prompt.json`、`api-request.json` | 放进自己的请求模板或 system context |
| 角色卡 | character card JSON、lorebook JSON | 导入支持角色卡和 lorebook 的聊天环境 |
| 灵魂档案 | `SOUL.md`、`skills/` | 把 `SOUL.md` 当作主身份文件 |
| Agent JSON | agent / model JSON | 导入支持 JSON 配置的本地或自托管环境 |

检查导出：`npm run check:exports`

## 🔒 隐私和使用感

- 本项目默认本地运行，私人聊天记录不会进入仓库
- 除非你自己配置外部模型 provider，否则资料不会主动发到第三方模型
- 你可以先用 stub ASR / stub TTS 和本地样例跑完整流程，再决定要不要接自己的语音或模型服务

用起来更像是在整理一份能继续打开的关系、角色或思考档案，而不是问完就散的一次性对话。

你会在这几个时刻打开它：

- 想读懂一段聊天的气氛
- 想把一段关系慢慢收好
- 想让原创角色真的开口
- 想把公开资料变成 Life Mentor
- 想把同一份人格包带到常用格式里

它会尽量把判断说清楚：证据是什么、置信度多少、下一步为什么这样建议。
这样你不是盲发，而是带着上下文、聊天节奏和自己的判断往前走 ✨

K.skill 也会顺着所在设备调整自己：最轻的环境只保留文字和语音，像会说话的人像这类更重的多媒体则会随着机器条件逐步解锁，从手机级别的浏览器一直到工作站；这套判断在设备本地完成，你也可以手动指定要用哪一档。

## 🧪 开发与验证

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
```

开发模式：

```bash
npm run dev
```

质量门禁（跑完才能发版）：

```bash
npm run lint
npm test
npm run check:readme
npm run check:exports
npm run test:e2e
npm run smoke
npm run score:release
npm run verify   # 会按顺序跑：lint → test → build → 导出检查 → README检查 → GUI e2e → smoke → 评分 → 打包预演
```

README 检查会确认：5 种语言、图片、命令、导出流程、Life Mentor 命名、使用说明、没有外部对比话术。
