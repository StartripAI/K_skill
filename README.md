<div align="center">

# K.skill

![K.skill 工作台](assets/hero-chat-workbench.svg)

**K.skill turns chats, characters, memories, and minds into portable AI persona systems.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-1f7a53.svg)](https://nodejs.org)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-Compatible-111111.svg)](https://agentskills.io)
[![Local First](https://img.shields.io/badge/Local--first-Privacy-0f7e6c.svg)](#隐私和安全边界)

**中文** · [English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

---

## K.skill 是什么

K.skill 是一个本地优先的 **Persona Pack OS**。它把聊天记录、角色设定、公开资料、关系记忆和心智模型，整理成可审计、可测试、可导出的 AI 人格包。

它不是单一前任 skill，不只是 SillyTavern 角色卡，也不只是名人思维蒸馏。K.skill 把这些能力合在一个完整流程里：

`上传/粘贴资料 → 解析 → 蒸馏 → 记忆 → Prompt Stack 检查 → 测试 → 导出 → 聊天验证`

## 四个主工作流

### 1. 恋人 / 关系记忆

从恋人、朋友、前任、亲密关系资料里提取共同经历、称呼习惯、语气、边界和重要记忆。

```text
用户 ❯ 还记得那家雨天去的书店吗？

K.skill ❯ 我只会基于你导入的记忆回答。
          记录里出现过：雨天、书店、你把伞落在那里。
          如果你想继续，我可以把这段整理进 relationship memory。
```

### 2. 动漫角色 / 原创角色 / 世界观

导入原创角色设定、世界观 Markdown、SillyTavern Character Card，把它们编译成可导出的 persona pack。

```text
用户 ❯ 进入雨档案馆的世界。

角色 ❯ 这里不用日期找记忆。我们用雨声、湿度、伞骨的折痕。
       你要查哪一场雨？
```

### 3. 精神导师 / 心智模型

从文章、访谈、笔记里抽取表达 DNA、心智模型、决策启发式、反模式和诚实边界。

```text
用户 ❯ 我有三个产品方向，怎么选？

导师 ❯ 先把不可逆决策和可逆实验分开。
       可逆的不要开会争，做一个小实验。
       不可逆的才值得写清楚判断标准。
```

### 4. 我要追TA / Crush Coach

这是 K.skill 的大卖点：上传你和 TA 的聊天记录，K.skill 帮你判断关系阶段、回应热度、风险信号、话题窗口，并生成尊重边界的回复。

```text
TA ❯ 在看！周末可能去，你也喜欢这种吗？

K.skill 分析 ❯
- Stage: warm
- Warmth: TA 主动反问、继续展开展览话题
- Strategy: 可以低压力推进，不要强邀约

稳妥版 ❯ 这个我有点被种草了。你说的那个展听起来挺有画面感，哪一部分最适合新手先看？

轻松版 ❯ 感觉你讲这个展的时候明显更有精神哈哈。我先记一笔，下次别嫌我问题多。

推进版 ❯ 那我认真提个低压力方案：哪天你刚好想去，可以叫我，我负责不乱发表外行感想。

边界提醒 ❯ 如果 TA 回避或拒绝，不追问、不施压，回到普通聊天或停止推进。
```

如果聊天记录里 TA 明确拒绝或不舒服，K.skill 只会给尊重边界、道歉、收尾建议。

## 为什么比参考项目更完整

| 能力 | ex-skill | nuwa-skill | ST memory | K.skill |
|---|---:|---:|---:|---:|
| 关系记忆 | ✅ | — | 部分 | ✅ |
| 公开资料心智蒸馏 | — | ✅ | — | ✅ |
| 角色卡 / 世界观 | 部分 | — | ✅ | ✅ |
| 我要追TA分析 | — | — | — | ✅ |
| Prompt Stack 检查 | — | — | 部分 | ✅ |
| 多平台导出 | 部分 | 部分 | — | ✅ |
| 结构化记忆和回滚 | 部分 | — | ✅ | ✅ |
| eval 测试 | — | ✅ | — | ✅ |
| 中英日韩西文档 | — | — | — | ✅ |

## 安装

```bash
git clone https://github.com/StartripAI/K_skill.git
cd K_skill
npm install
npm run build
```

本地 Web GUI：

```bash
npm run dev
```

打开终端显示的本地地址，通常是 `http://127.0.0.1:5173`。

CLI：

```bash
npm run cli -- --help
```

全局本地试用：

```bash
npm link
kskill --help
```

## 5 分钟上手：我要追TA

```bash
npm run cli -- pursue examples/crush-chat-zh.txt --me 我 --ta TA --goal ask_out --out pursuit-output
```

生成：

```text
pursuit-output/
  pursuit_report.md
  topic_plan.md
```

生成 3 条可直接发送的回复：

```bash
npm run cli -- reply examples/crush-chat-zh.txt --latest "周末可能去 你也喜欢这种吗？" --me 我 --ta TA --style natural
```

生成话题计划：

```bash
npm run cli -- topics examples/crush-chat-zh.txt --me 我 --ta TA
```

拒绝场景测试：

```bash
npm run cli -- pursue examples/refusal-chat-en.txt --me Me --ta TA --goal recover_cold_chat
```

这个场景只会输出尊重边界和停止推进建议。

## 创建 Persona Pack

```bash
npm run cli -- init "Rain Archive" --type character --language zh --out local-packs/rain-archive
```

导入资料并蒸馏：

```bash
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
```

查看 prompt stack：

```bash
npm run cli -- inspect local-packs/rain-archive
```

查看记忆：

```bash
npm run cli -- memory local-packs/rain-archive
```

运行检查：

```bash
npm run cli -- eval local-packs/rain-archive
```

## 导出到各平台

Codex / Claude Code Agent Skill：

```bash
npm run cli -- compile local-packs/rain-archive --target codex
npm run cli -- compile local-packs/rain-archive --target claude
```

使用方式：

```bash
mkdir -p .codex/skills
cp -R local-packs/rain-archive/exports/codex .codex/skills/rain-archive

mkdir -p .claude/skills
cp -R local-packs/rain-archive/exports/claude .claude/skills/rain-archive
```

ChatGPT：

```bash
npm run cli -- compile local-packs/rain-archive --target chatgpt
```

把 `exports/chatgpt/instructions.md` 放入 GPT 或 Project instructions，把 `knowledge/` 里的文件作为知识文件上传。

DeepSeek / OpenAI-compatible API：

```bash
npm run cli -- compile local-packs/rain-archive --target deepseek
```

把 `exports/deepseek/system-prompt.json` 中的 `messages` 用到 chat completion 请求里。

SillyTavern：

```bash
npm run cli -- compile local-packs/rain-archive --target sillytavern
```

导入 `character-card-v2.json`，并按需导入 `lorebook.json`。

Hermes：

```bash
npm run cli -- compile local-packs/rain-archive --target hermes
```

把 `SOUL.md` 合并到 Hermes personality，把 `skills/` 目录复制到 Hermes skills 目录。

LobeChat / Open WebUI：

```bash
npm run cli -- compile local-packs/rain-archive --target lobe
npm run cli -- compile local-packs/rain-archive --target openwebui
```

导入生成的 agent JSON，或复制其中的 system prompt 到对应模型/Agent 设置。

## Web GUI 怎么用

1. `npm run dev`
2. 在左侧选择工作流：关系记忆、角色世界、精神导师、我要追TA。
3. 在中间面板上传文件或粘贴资料。
4. `我要追TA` 中填写 `Me` 和 `TA` 的聊天记录名称。
5. 选择目标：破冰、延续聊天、约出来、判断机会、挽回冷场、写回复。
6. 查看 Stage、Warmth、Risk、Action。
7. 在 Reply Lab 中输入 TA 最新一句话，选择自然/幽默/真诚/克制/直球/温柔。
8. 右侧检查 Prompt Stack，确认用了哪些身份、记忆和边界。
9. 保存 report，或用 CLI 导出到目标平台。

## Persona Pack 结构

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

每个判断都尽量带 source、evidence、confidence。K.skill 不会把“猜测”伪装成事实。

## 隐私和安全边界

- 本项目默认本地运行。
- 私人聊天记录不会进入 Git，`.gitignore` 已排除本地包、输出和常见聊天记录文件。
- 不提供 PUA、操控、制造焦虑、冷暴力、绕过拒绝的策略。
- 不鼓励冒充真实人物。
- TA 明确拒绝或不舒服时，`我要追TA` 只给尊重边界、道歉、收尾和自我复盘建议。
- 导出到第三方平台前，请确认你有权使用相关资料。

## 开发与测试

```bash
npm install
npm run lint
npm test
npm run build
```

Smoke test：

```bash
npm run cli -- pursue examples/crush-chat-zh.txt --me 我 --ta TA --goal ask_out
npm run cli -- reply examples/crush-chat-en.txt --latest "Then you should bring your suspiciously good cafe radar too." --me Me --ta TA
npm run cli -- init "Demo Mentor" --type advisor --language en --out local-packs/demo-mentor
npm run cli -- import examples/mentor-source.md --type advisor --pack local-packs/demo-mentor
npm run cli -- compile local-packs/demo-mentor --target codex
npm run cli -- eval local-packs/demo-mentor
```

## Roadmap

- 更完整的微信、QQ、iMessage、Telegram、WhatsApp 导入器。
- 本地 SQLite vault 和可视化版本回滚。
- 更强的 eval harness。
- Persona marketplace 的私有/授权发布模式。
- Tauri 桌面版。

## License

MIT
