<div align="center">

# K.skill

![K.skill six social persona scenes](assets/readme/hero-six-scenes.png)

**把聊天记录、角色设定、关系记忆和公开资料，整理成能直接使用的 AI 人格系统。**  
**Local persona workbench for chats, characters, relationship memory, and Life Mentor packs.**

**中文** · [English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

先说人话：K.skill 是一个本地人格工作台。  
你把资料丢进去，它帮你整理、分析、做成 persona pack，然后导出到 Codex、Claude、ChatGPT、DeepSeek、SillyTavern、Hermes、LobeChat、Open WebUI。

你可以拿它做 6 类特别直观的事：

| 场景 | 你丢进去 | K.skill 给你什么 |
|---|---|---|
| 我要追TA | 你和 TA 的聊天记录 | 判断聊天窗口、怎么回、什么时候收一收、3 条能直接发的回复 |
| 前任 / 恋人 / 关系记忆 | 聊天记录、共同经历、补充记忆 | 一份能复盘、能延续氛围的关系记忆 |
| 动漫角色 | 原创角色设定、二次元 OC、世界观 | 美女帅哥角色、说话方式、lorebook、聊天入口 |
| 电影人物 | 剧本片段、角色小传、场景卡 | 虚拟电影角色包，带人物弧线、台词风格、场景记忆 |
| 虚拟人物 | AI companion、虚拟主播、游戏 NPC | 一个能稳定聊天的原创人格 |
| 公开人物 Life Mentor | 公开文章、访谈、原则、笔记 | 像“公开资料版商业人物思路”一样陪你拆问题 |

重点是：能用。  
README 里写到的命令、例子、导出目标，都有真实文件和测试，不是摆设。

## 先看 6 个场景

第一张图现在就是 K.skill 的真正定位：不是单一聊天框，而是 6 个场景入口。

- 想追 TA：看聊天热度，给你三条自然回复。
- 想复盘一段关系：把聊天和共同记忆整理成长期上下文。
- 想和动漫 OC 聊：把角色设定和世界观做成可导出角色包。
- 想做电影人物：把剧本人物变成能说话的虚拟角色。
- 想做虚拟人格：做 AI companion、虚拟主播、NPC、产品角色。
- 想和公开人物的思路对话：用公开资料做 Life Mentor，拿来拆产品、创业、写作和选择。

这里的“公开人物”可以理解成公开资料版心智模型。比如你想研究马斯克式产品判断、创业表达和决策习惯，K.skill 可以把公开材料里的思路整理成一个能聊天、能追问、能帮你拆选择的 Life Mentor。

## 你最可能先用哪个

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

如果你现在最急的是“TA 刚回我了，我该怎么回”，直接用 **Crush Coach / 我要追TA**。

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
如果气氛已经明显变冷，它会建议你体面收住，让对话留点余地。

## 四个主工作流

![K.skill GUI workflow](assets/readme/web-gui-flow.png)

K.skill 正式分成四条线。别混着用，按你的目的选就行。

| 工作流 | 什么时候用 | 最适合的结果 |
|---|---|---|
| **Crush Coach / 我要追TA** | 你想知道怎么回 TA、怎么开话题、适不适合约 | 回复建议、话题计划、聊天节奏 |
| **Relationship Memory / 关系记忆** | 你想整理恋人、朋友、前任、亲密关系资料 | 共同记忆、关系语气、长期上下文 |
| **Character World / 角色与世界观** | 你想做动漫角色、电影人物、虚拟人物、世界观 | 角色身份、世界规则、聊天人格 |
| **Life Mentor / 人生陪跑模型** | 你想把公开资料、文章、笔记变成思考陪跑 | 表达习惯、判断模型、可追问思路 |

一句话理解：

- **Crush Coach**：帮你回消息。
- **Relationship Memory**：帮你整理关系。
- **Character World**：帮你做角色。
- **Life Mentor**：帮你提炼思路。

## 我要追TA：先把这条消息回好

![K.skill Crush Coach social flow](assets/readme/crush-coach-reply-lab.png)

你可以上传微信、QQ、iMessage、Telegram、WhatsApp 导出的聊天，也可以直接粘贴聊天记录。

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
也就是：它为什么这么判断，确定度有多高。没证据就不会装懂。

## Relationship Memory：关系记忆

![K.skill relationship memory](assets/readme/relationship-memory-chat.png)

它更像一个关系整理器：把共同经历、称呼、说话习惯、重要事件和聊天氛围放进一个可检查的记忆包。

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

它会整理出：

- 共同事件：比如雨天书店、遗落的伞。
- 说话习惯：谁更爱讲细节、谁更克制。
- 关系偏好：比如“自然一点，不要太戏剧化”。
- 氛围：哪些话适合轻轻带过，哪些记忆适合展开。

## Character World：动漫角色、虚拟人物、世界观

![K.skill anime character world](assets/readme/anime-character-world.png)

这一块给创作者和角色党用。  
你可以把原创角色、二次元 OC、世界观 Markdown、SillyTavern Character Card V2、lorebook 都丢进去。

它不是只学一句口癖。它会一起整理：

- 角色是谁。
- 说话是什么节奏。
- 世界观规则是什么。
- 哪些记忆会被触发。
- 角色稳定感怎么保持。

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

你也可以用它做电影人物。  
比如你写了一个角色，有剧本片段、人物小传、关键场景、台词风格，K.skill 可以把它做成一个可聊天的虚拟电影角色。

你可以把它理解成“剧本角色的聊天版本”。  
角色小传、关键场景、人物弧线、台词节奏，都会被整理进去。

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
- SillyTavern card 和 lorebook。

## Virtual Persona：虚拟人物人格

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

这个适合做：

- AI companion。
- 虚拟主播人格。
- 游戏 NPC。
- 社交头像人格。
- 品牌或产品角色。
- 卡通人物对话。

它和 Relationship Memory 的区别是：  
Relationship Memory 是整理真实关系资料；Virtual Persona 是做一个原创虚拟人格。

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

这个模块适合把公开文章、访谈、演讲、笔记、原则整理成一套能对话的思考方式。

比如：

- 某个创业者公开表达里的产品判断。
- 某个作者公开文章里的写作原则。
- 你自己的决策笔记。
- 一个团队内部的做事方法。

如果你想做“马斯克式公开资料对话”，可以把公开访谈、文章、发布会内容整理进去。最后得到的不是冷冰冰的资料摘要，而是一个可以继续追问的 Life Mentor：产品怎么取舍、目标怎么拆、风险怎么看、下一步怎么赌。

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
你可以把它理解成“可搬走的人格文件夹”。

```text
persona.yaml          机器能读的结构化人格包
persona.md            人能读的人格说明
sources/              你导入的资料
memory/               记忆、修正、lorebook
distillation/         evidence、claims、contradictions
exports/              导出到不同工具的文件
```

Prompt Stack 是用来检查的。  
它会把人格拆成几层，防止黑箱：

```text
identity       这个人格是谁，怎么说话
mental_models  Life Mentor 或角色的判断方式
memory         事实、关系、事件
rhythm         关系节奏、表达分寸、聊天氛围
export layer   不同平台要用的格式
```

## GUI 怎么用

![K.skill local GUI flow](assets/readme/web-gui-flow.png)

普通用户先用 GUI，最直观。

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

打开终端里的地址，一般是：

```text
http://127.0.0.1:5999
```

流程很简单：

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
POST /api/packs/:id/pastes
POST /api/packs/:id/pursuit
GET  /api/reports/:reportId/download
POST /api/packs/:id/exports
GET  /api/exports/:exportId/download
GET  /api/packs/:id/memory
PATCH /api/packs/:id/memory
```

## CLI 怎么用

开发者、批处理、自动化，用 CLI 更快。

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

一个 persona pack，可以进很多工具。

| 目标 | 生成什么 | 怎么用 |
|---|---|---|
| Codex | `SKILL.md`、`references/` | 放进 Codex skills 目录 |
| Claude | `SKILL.md`、`references/` | 放进 Claude Code skill 目录 |
| ChatGPT | `instructions.md`、`knowledge/`、`gpt-config.json` | 建 GPT 或 Project，粘 instructions，上传 knowledge |
| DeepSeek | `system-prompt.json`、`api-request.json` | 当 API system context 用 |
| SillyTavern | `character-card-v2.json`、`lorebook.json` | 导入角色卡和 lorebook |
| Hermes | `SOUL.md`、`skills/` | `SOUL.md` 做主身份文件 |
| LobeChat | `lobe-agent.json` | 导入 agent JSON |
| Open WebUI | `openwebui-agent.json` | 导入 agent/model JSON |

检查导出：

```bash
npm run check:exports
```

## 隐私和使用感

本项目默认本地运行。私人聊天记录不会进入 Git。  
除非你自己配置外部模型 provider，否则资料不会主动发到第三方模型。

K.skill 更适合做这几件事：

```text
帮你读聊天氛围
帮你整理关系记忆
帮你做原创角色
帮你把公开资料变成 Life Mentor
帮你导出到常用 AI 工具
```

它会尽量把判断说清楚：证据是什么、置信度多少、下一步为什么这样建议。这样你不是盲发，而是知道自己为什么这么发。

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

`npm run verify` 会完整跑 lint、test、build、导出检查、README 检查、GUI e2e、smoke、release score 和 npm pack dry-run。

当前分数门槛：

```text
Open-source uniqueness >= 120
Industrial product >= 120
Excellence >= 10
Endgame >= 10
```

README 检查会确认：5 种语言、图片、命令、导出目标、Life Mentor 命名、使用说明、没有外部对比话术。

## 许可证

Apache-2.0
