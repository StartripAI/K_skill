<div align="center">

# K.skill

![K.skill complete persona system](assets/readme/hero-persona-workbench.png)

**K.skill turns chats, characters, memories, crushes, and minds into portable AI persona systems.**

**中文** · [English](README_EN.md) · [日本語](README_JA.md) · [한국어](README_KO.md) · [Español](README_ES.md)

</div>

K.skill 是一个本地优先的 **Persona Pack OS**，也是一个可以直接使用的完整人格系统。它把聊天记录、关系资料、原创角色、电影人物、世界观、公开资料和个人原则整理成可检查、可测试、可导出的 persona pack。你可以用 GUI 完成上传、解析、报告、Reply Lab 和导出，也可以用 CLI 把同一套 pack 编译到 Codex、Claude、ChatGPT、DeepSeek、SillyTavern、Hermes、LobeChat、Open WebUI。

它不是一个空壳 prompt 模板。README 里写到的每条路径都对应真实命令、真实示例、真实导出文件和本地测试门禁。

## 先看一个 DM 场景

![K.skill Crush Coach Reply Lab](assets/readme/crush-coach-reply-lab.png)

TA 发来一句话，你不确定该继续、暂停、邀约，还是换话题。K.skill 的 Crush Coach 会把聊天记录转成可读的社交信号，而不是给套路话术。

```text
TA: 周末可能去，你也喜欢这种展吗？

K.skill 判断：
- relationship stage: warm
- warmth: TA 主动反问，并继续展开展览话题
- risk: 当前没有明确拒绝或不舒服
- evidence: 最近消息里有反问、兴趣词、轻松语气
- confidence: 0.76
- safety: no impersonation, no pressure after refusal

Reply Lab 输出：
稳妥版：这个我有点被种草了。你说的那个展听起来挺有画面感，哪一部分最适合新手先看？
轻松版：感觉你讲这个展的时候明显更有精神哈哈。我先记一笔，下次别嫌我问题多。
稍微推进版：那我认真提个低压力方案：哪天你刚好想去，可以叫我，我负责不乱发表外行感想。
```

如果聊天记录里 TA 明确拒绝、不舒服或要求停止，K.skill 不会继续生成推进策略，只会给礼貌收尾、道歉、尊重边界和自我复盘。

## 四个主工作流

![K.skill GUI workflow](assets/readme/web-gui-flow.png)

| 工作流 | 适合谁 | 上传什么 | 得到什么 | 什么时候用 |
|---|---|---|---|---|
| **Crush Coach / 我要追TA** | 想自然推进聊天的人 | 微信、QQ、iMessage、Telegram、WhatsApp、粘贴记录 | `pursuit_report.md`、`topic_plan.md`、3 条可发送回复、send-or-not 判断 | 不确定怎么回、怎么约、是否该暂停 |
| **Relationship Memory / 关系记忆** | 想整理恋人、朋友、前任、亲密关系资料的人 | 聊天记录、共同经历、补充记忆 | 关系记忆、称呼习惯、共同事件、边界提醒、可导出 persona pack | 复盘关系、保留长期上下文、写作或互动叙事 |
| **Character World / 角色与世界观** | 创作者、二次元用户、OC 作者、跑团/剧情用户 | Markdown 设定、角色卡、世界观、lorebook、电影人物设定 | 角色人格、世界规则、Prompt Stack、SillyTavern card、lorebook | 想把角色真正聊起来，而不是只有口癖 |
| **Life Mentor / 人生陪跑模型** | 想把公开资料、笔记、原则变成可对话模型的人 | 文章、访谈、公开写作、决策笔记、个人原则 | mental models、heuristics、anti-patterns、evidence、confidence、诚实边界 | 做决策、复盘选择、把思维方式带进常用 AI 工具 |

四个模块互相区分清楚：

- **Crush Coach** 只处理你和 TA 的关系推进，不做操控，不绕过拒绝。
- **Relationship Memory** 重点是长期关系记忆，不负责追求建议。
- **Character World** 处理虚构角色、原创世界、电影人物和角色卡，不冒充现实真人。
- **Life Mentor** 处理公开资料和个人原则，输出人生陪跑模型，不宣称自己是某个真实人物。

## Crush Coach / 我要追TA

![K.skill Crush Coach social flow](assets/readme/crush-coach-reply-lab.png)

Crush Coach 是 K.skill 的主卖点。它把聊天记录解析成关系阶段、热度信号、风险信号、话题窗口、邀约时机和边界判断。

GUI 怎么用：

1. `npm run dev` 或 `npm run cli -- serve --port 5999` 启动本地 GUI。
2. 左侧选择 `Crush Coach`。
3. 上传聊天记录，或把最新对话粘贴到输入框。
4. 设置 `我` 和 `TA` 的名字。
5. 选择目标：破冰、延续聊天、判断机会、约出来、挽回冷场、写一条现在能发的回复。
6. 点击 `Run lab`。
7. 下载 `pursuit_report.md`，查看 `Reply Lab` 和 `topic_plan.md`。

CLI 怎么跑：

```bash
npm run cli -- pursue examples/crush-chat-zh.txt --me 我 --ta TA --goal ask_out --out tmp/pursuit-zh
npm run cli -- reply examples/crush-chat-zh.txt --latest "周末可能去 你也喜欢这种吗？" --me 我 --ta TA --style natural
npm run cli -- topics examples/crush-chat-zh.txt --me 我 --ta TA
npm run cli -- send-or-not examples/crush-chat-zh.txt --draft "那我们周末一起去吧？" --latest "周末可能去 你也喜欢这种吗？"
```

真实场景已经放在 `examples/`：

```text
examples/crush-chat-zh.txt       中文暧昧推进
examples/crush-chat-en.txt       英文自然延续
examples/refusal-chat-en.txt     明确拒绝，只能收尾
examples/cold-chat-zh.txt        冷场续聊，判断是否该暂停
```

生成文件：

```text
tmp/pursuit-zh/
  pursuit_report.md
  pursuit_report.json
  topic_plan.md
```

报告会包含 `evidence` 和 `confidence`。如果证据不足，它会说证据不足，不会装懂。

## Relationship Memory / 关系记忆

![K.skill relationship memory](assets/readme/relationship-memory-chat.png)

Relationship Memory 把关系资料整理成长期记忆，而不是让 AI 复制某个人。它适合复盘一段关系、保存共同经历、提取称呼习惯、整理边界和重要事件。

GUI 怎么用：

1. 左侧选择 `Relationship`。
2. 上传 `examples/relationship-memory-chat.txt` 或自己的聊天记录。
3. 在 parse preview 里确认说话人、消息数、语言和异常行。
4. 点击上传后，K.skill 会把资料写入本地 vault。
5. 打开 Prompt Stack 或 memory 面板，查看 profile facts、relationship facts、episodes、corrections。
6. 需要导出时选择目标平台，下载 zip。

CLI 怎么跑：

```bash
npm run cli -- init "Rain Bookstore Memory" --type relationship --language zh --out local-packs/rain-bookstore
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/rain-bookstore
npm run cli -- memory local-packs/rain-bookstore
npm run cli -- inspect local-packs/rain-bookstore
```

Relationship Memory 的输出重点：

- 共同经历：雨天书店、遗落的伞、自然一点的表达偏好。
- 说话风格：称呼、节奏、细节密度。
- 边界：不冒充真实本人，不发明私人事实。
- 可修正：用户可以追加 corrections，避免错误记忆继续扩散。

## Character World / 角色与世界观

![K.skill anime character world](assets/readme/anime-character-world.png)

Character World 负责虚构角色、原创角色、二次元人物、世界观、lorebook 和角色卡。它的目标不是套一个口癖，而是把身份、世界规则、记忆触发、说话节奏和安全边界一起放进 persona pack。

CLI 示例：

```bash
npm run cli -- init "Rain Archive" --type character --language zh --out local-packs/rain-archive
npm run cli -- import examples/character-world.md --type character --pack local-packs/rain-archive
npm run cli -- distill local-packs/rain-archive
npm run cli -- inspect local-packs/rain-archive
```

适合输入：

- 原创角色设定。
- 世界观 Markdown。
- 角色语音样本。
- SillyTavern Character Card V2。
- lorebook。
- 手动补充的角色边界。

得到输出：

- `persona.yaml`：结构化 persona pack。
- `persona.md`：可读人格说明。
- `memory.lorebook`：可触发世界观记忆。
- `Prompt Stack`：identity、memory、mental models、boundaries。
- 多平台导出文件。

## Movie Character / 电影人物

![K.skill movie character pack](assets/readme/movie-character-pack.png)

Movie Character 是 Character World 的独立示例。它面向原创电影人物、剧本角色、分镜设定、角色弧线和台词样本。它不复制受版权保护角色，不模仿真人演员，不宣传冒充某个明星。

CLI 示例：

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

得到输出：

- 角色身份和 arc。
- 关键场景记忆。
- 台词节奏和视觉意象。
- 不能越界的版权/真人边界。
- 可导入 SillyTavern 的角色卡和 lorebook。

## 虚拟人物人格

![K.skill virtual persona chat](assets/readme/virtual-persona-chat.png)

虚拟人物人格适合创建完全原创的 AI companion、虚拟主播设定、游戏 NPC、社交头像人格或产品角色。它和 Relationship Memory 的区别是：虚拟人物不来自真实亲密关系，不需要承载真实人物身份。

GUI 路径：

1. 选择 `Character`。
2. 上传角色设定或粘贴 persona brief。
3. 在 preview 里确认资料来源。
4. 点击上传并蒸馏。
5. 用 Prompt Stack 检查 identity、voice、memory 和 boundaries。
6. 导出到目标客户端。

CLI 路径：

```bash
npm run cli -- init "Nova Social" --type character --language zh --out local-packs/nova-social
npm run cli -- import examples/character-world.md --type character --pack local-packs/nova-social
npm run cli -- compile local-packs/nova-social --target lobe --out local-packs/nova-social/exports/lobe
```

## Life Mentor / 人生陪跑模型

![K.skill life mentor model](assets/readme/life-mentor-model.png)

Life Mentor 把公开资料、文章、访谈、笔记、决策记录和个人原则整理成人生陪跑模型。它输出的是思维方式和判断习惯，不是现实人物替身。

CLI 示例：

```bash
npm run cli -- init "Decision Life Mentor" --type advisor --language en --out local-packs/decision-life-mentor
npm run cli -- import examples/life-mentor-source.md --type advisor --pack local-packs/decision-life-mentor
npm run cli -- distill local-packs/decision-life-mentor
npm run cli -- inspect local-packs/decision-life-mentor
```

Life Mentor 会提取：

- expression DNA：表达节奏、取舍方式、常用结构。
- mental models：可复用判断模型。
- heuristics：可以执行的经验规则。
- anti-patterns：不建议继续的思考习惯。
- contradictions：资料之间的冲突。
- evidence / confidence：每个判断的证据和置信度。

公众人物和明星相关资料只能作为公开材料的 Life Mentor 模型处理。K.skill 不生成“我是某某本人”的身份，不生成可识别真人冒充，也不发明私人经历。

## Persona Pack 是什么

K.skill 的核心产物是 persona pack。它把人格、记忆、证据、边界和导出说明放在一起。

```text
persona.yaml          结构化人格包
persona.md            可读人格说明
sources/              用户导入资料
memory/               episodes, corrections, lorebook
distillation/         evidence, claims, contradictions, runs
exports/              目标平台文件
```

Prompt Stack 会把 pack 拆成可检查层：

```text
identity       角色身份、语气、表达 DNA
mental_models  Life Mentor 或角色的判断模型
memory         profile facts、relationship facts、episodes
boundaries     no impersonation、no pressure after refusal、安全限制
export layer   不同平台需要的格式
```

## GUI 怎么用

![K.skill local GUI flow](assets/readme/web-gui-flow.png)

本地 GUI 是最适合普通用户的入口。

```bash
npm install
npm run build
npm run cli -- serve --port 5999
```

打开终端显示的地址，通常是 `http://127.0.0.1:5999`。

常用流程：

1. 选择工作流：Crush Coach、Relationship Memory、Character World、Life Mentor。
2. 输入 pack name 和语言。
3. 上传文件或粘贴资料。
4. 勾选 consent / privacy。
5. 查看 parse preview：格式、消息数、说话人、语言、样例消息。
6. 对 Crush Coach 点击 `Run lab`。
7. 下载 report markdown。
8. 选择导出目标并下载 zip。

GUI 支持本地 API：

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

CLI 适合开发者、批处理和版本化工作流。

```bash
npm run cli -- --help
npm run cli -- init "My Pack" --type relationship --language zh --out local-packs/my-pack
npm run cli -- import examples/relationship-memory-chat.txt --type relationship --pack local-packs/my-pack
npm run cli -- distill local-packs/my-pack
npm run cli -- inspect local-packs/my-pack
npm run cli -- memory local-packs/my-pack
npm run cli -- eval local-packs/my-pack
```

Crush Coach 命令：

```bash
npm run cli -- pursue examples/crush-chat-en.txt --me Me --ta TA --goal judge_chance --out tmp/pursuit-en
npm run cli -- reply examples/crush-chat-en.txt --latest "Maybe, I might go this weekend." --me Me --ta TA --style gentle
npm run cli -- topics examples/cold-chat-zh.txt --me 我 --ta TA
npm run cli -- send-or-not examples/refusal-chat-en.txt --draft "Please give me one more chance." --latest "Please stop asking."
```

导出命令：

```bash
npm run cli -- compile local-packs/my-pack --target codex --out local-packs/my-pack/exports/codex
npm run cli -- export-zip local-packs/my-pack --target sillytavern --out local-packs/my-pack/exports/sillytavern.zip
```

## 导出到真实工具

![K.skill export matrix](assets/readme/export-matrix.png)

同一个 persona pack 可以导出到多个真实客户端。

| 目标 | 生成文件 | 使用方式 |
|---|---|---|
| Codex | `SKILL.md`、`references/persona.md`、`references/memory.md`、`references/evidence.json` | 把导出的 skill 目录放进 Codex skills 目录，按 `SKILL.md` 激活 |
| Claude | `SKILL.md`、`references/` | 放进 Claude Code skill 目录，保持 references 同级 |
| ChatGPT | `instructions.md`、`knowledge/`、`gpt-config.json` | 创建 GPT 或 Project，把 instructions 粘贴进去，上传 knowledge 文件 |
| DeepSeek | `system-prompt.json`、`api-request.json` | 用作 chat completion 的 system messages 或 API 请求模板 |
| SillyTavern | `character-card-v2.json`、`lorebook.json` | 在角色卡导入界面导入 card，再导入 lorebook |
| Hermes | `SOUL.md`、`skills/` | 以 `SOUL.md` 作为主身份文件，把 skills 目录一起放入 |
| LobeChat | `lobe-agent.json` | 在 agent 导入入口导入 JSON |
| Open WebUI | `openwebui-agent.json` | 在 workspace/model/agent 配置入口导入 JSON |

检查所有导出目标：

```bash
npm run check:exports
```

## 隐私和安全边界

K.skill 默认 local-first。本项目默认本地运行，私人聊天记录不会进入 Git。只有你显式配置外部模型 provider 时，资料才会发给对应服务。

安全原则：

- no impersonation：不宣称自己是真实本人。
- no pressure after refusal：明确拒绝后不提供推进策略。
- 不做 PUA，不制造焦虑，不提供冷暴力策略。
- 不诱导泄露隐私。
- 不追踪、不骚扰、不绕过边界。
- 不发明私人事实。
- 对证据不足的结论标注低 confidence。

如果 TA 明确拒绝：

```text
K.skill 只允许：
- 礼貌收尾
- 道歉
- 停止推进
- 尊重空间
- 自我复盘
```

## 开发与验证

![K.skill complete product workbench](assets/readme/hero-persona-workbench.png)

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

`npm run verify` 会串行执行 lint、test、build、exports、README 检查、e2e、smoke、release score 和 npm pack dry-run。README 检查会确认 5 种语言、所有图片、所有核心命令、所有导出目标、Life Mentor 命名、安全边界和 no outside comparison claims。

## 许可证

Apache-2.0
