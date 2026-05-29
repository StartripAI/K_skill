# Spec B — 数据采集 & 移植管线 (Data Acquisition & Portability)

- 项目: K_skill (StartripAI/K_skill)
- 日期: 2026-05-29
- 状态: Draft（待用户评审）
- 关联: Spec A — 能力分级 & 跨平台适配（随后编写）

## 1. 目标与范围

把一个人的**源材料**（聊天记录、语音、照片、视频）从其原始平台/设备里取出来，规整进一个**可移植的 K_skill pack**，让生成（声音克隆、视频）在有算力的设备上完成、成品在任何设备上重温。

**本质判断**：解析不是问题（`importers` 已支持 wechat/qq/imessage/telegram/whatsapp + 通用格式），**采集（从各 App/设备把数据抠出来）才是问题**，其中微信是最难的一堵墙。

范围内：采集 provider 体系、微信提取管线、多平台导入、语音采集、pack 搬运、各阶段运行位置。
范围外：生成端（声音克隆/视频模型）与档位探测——属于 Spec A。

## 2. 设计原则

1. **本地优先 / 不上云**：所有采集、解密、转码在用户自己的设备上完成；密钥与原始数据绝不离开设备。
2. **松耦合、可替换**：微信类提取工具脆弱且会消失（PyWxDump 已删库）。**绝不 vendor 解密核心**，只通过适配器调用外部工具；任一工具失效可换下一个。
3. **优雅降级**：每个平台都有一条能走通的路，只是质量分级——官方导出 > 工具提取 > 手动兜底。
4. **个人用途、自有数据**：本设计面向个人导出**自己的**聊天/语音数据；不提供面向他人数据的批量采集。

## 3. 核心模型：采集 → 解析 → 媒体 → pack

```
[采集 Acquisition] → [解析 importers] → [媒体 media(+ASR)] → [pack-io 打包]
       ↑ 新增                ↑ 现有              ↑ 现有             ↑ 现有
```

设备分工（详见 §4，并接回 Spec A 的档位）：

- **手机/平板 = 采集端**：聊天记录就在手机里、麦克风也在手机上。导入导出文件、录音、选照片。
- **强机（桌面 host）= 提取 + 生成端**：跑微信提取管线、声音克隆、视频生成。
- **pack = 搬运工**：采集进包 → 同步到强机做重活 → 成品包到处播。

“移植”的答案就是 pack 本身：包在设备间流动，承载从任意设备采集到的内容。

## 4. 采集分级（按设备能力）

| 设备 | 能做的采集 | 不能做 |
|---|---|---|
| 手机/平板/弱机（PWA 客户端） | 上传聊天导出文件、录语音(MediaRecorder)、选照片、手动粘贴、截图 | 微信本地库解密提取（无 PC 客户端/无权限） |
| 桌面 host（Mac/Win/Linux） | 上述全部 + **微信/QQ 提取管线** + iMessage 本地库 + iPhone 备份解析 | — |

→ 因此“采集”本身是分级的：微信深度提取是**桌面 host 专属能力**，手机/弱机用户回退到手动兜底。该分级与 Spec A 的档位探测共用同一 `HardwareProfile`。

## 5. 采集 Provider 注册表

沿用 `voice`/`avatar` 的适配器模式，**新增 `packages/acquisition`** 负责“把原始数据取到手”，`importers` 保持纯解析职责（取到的原始数据交给它解析）。定义统一 provider 描述：

```ts
type AcquisitionPlatform =
  | "whatsapp" | "telegram" | "imessage" | "wechat" | "qq" | "line" | "generic" | "manual";
type AcquisitionMethod =
  | "file-export" | "local-api" | "device-backup" | "manual-paste" | "screenshot-ocr" | "mic-capture";

interface AcquisitionProviderInfo {
  id: string;
  platform: AcquisitionPlatform;
  method: AcquisitionMethod;
  runtime: "desktop-host" | "browser" | "any";   // 能在哪运行
  yields: Array<"text" | "voice" | "image" | "video">;
  local: true;                                     // 恒为本地
  reliability: "robust" | "fragile" | "best-effort";
  external?: { tool: string; swappable: true };    // 例如 chatlog；标记可替换
  privacyLabel: "local";
}

interface AcquisitionProvider {
  info: AcquisitionProviderInfo;
  isAvailable(profile: HardwareProfile): Promise<boolean>;  // 工具/客户端/备份是否就绪
  acquire(input): Promise<ParsedSource[]>;  // 归一到现有 importers 的 ParsedSource + media 资产
}
```

所有 provider 的产出都**归一到现有 `importers` 的 `ParsedSource` 结构 + `media` 资产**，下游打包逻辑零改动。

### 5.1 文件导入类（基于现有 importers，robust）

- WhatsApp「导出聊天」(.txt + 媒体 zip)、Telegram 桌面导出 (JSON/HTML)、iMessage（Mac `~/Library/Messages/chat.db`）、SillyTavern 角色卡、通用 text/json/csv/html。
- 这些走现成 parser，体验最好，跨设备（手机也能上传文件）。

### 5.2 微信 / QQ 提取（新增，desktop-host only，可替换）

- **路线由运行时 `isAvailable()` 自动择优（见 D1），不让用户选**：
  - **Mac 主路线**：`BlueMatthew/WechatExporter` 解析 **iPhone 备份**（Mac 上可靠、最稳）。
  - **chatlog 优先于可用平台**：`sjzar/chatlog`——本地服务，localhost API/MCP 暴露微信数据，Go 跨平台；Windows 直接用，Mac 待 Phase 0 spike 验证后启用。
  - **备选**：摄入 `LC044/WeChatMsg(留痕)` 导出文件。
- **数据归一**：取到的消息 → 现有 `wechat` parser；媒体 → `media` 资产；**语音 SILK→WAV 用 ffmpeg 转码**。
- **可替换契约**：解密/取数仅通过 `external.tool` 适配器；K_skill 仓库内**不含任何解密代码**。

### 5.3 手动兜底（universal，best-effort）

- 手动粘贴文本（含微信“合并转发的聊天记录”）、上传媒体文件、截图 OCR。
- 任何平台、任何设备都可用，是优雅降级的最后一档。

### 5.4 语音采集

- 来源：手机麦克风现录（MediaRecorder）、导出的语音条、视频里的音轨。
- 用于**克隆**需约 1–3 分钟干净人声；UI 明确告知。
- **真实预期**：微信语音可提取（SILK→WAV），但码率低、片段短——做**内容转写**可靠，做**克隆参考勉强**，需提示用户。

## 6. 数据流与运行位置

1. **采集**：provider 按设备 runtime 选择（手机=文件/录音/手动；桌面=全部+微信管线）。
2. **解析**：现有 `importers.parseImport` → `ParsedSource`。
3. **媒体**：现有 `media`（分类、ASR 转写、ffmpeg 转码）→ `MediaAsset`。
4. **打包**：现有 `pack-io` → pack。
5. **搬运**：pack 通过 `exporters`/`importers` 在设备间导出导入；强机做生成；成品播放于任意设备。

## 7. 与现有代码集成

- `importers/src`：复用其 `ImportFormat`/`parseImport`/detect；微信 provider 把提取结果喂给现成 `wechat` 分支。
- `media/src`：复用 `parseMediaFile`/ASR/资产模型；新增 SILK→WAV 转码挂在 ffmpeg 调用点。
- `pack-io`/`exporters`/`importers`：pack 打包与搬运，零改动或微调。
- `server`（Hono）：新增 `/acquisition/providers`（列可用 provider，按 `HardwareProfile` 过滤）与采集触发端点；仅在桌面 host 暴露微信相关端点。
- `apps/web`（PWA）：手机端文件上传 / 录音 / 粘贴 / 截图 UI；按可用 provider 显隐。

## 8. 隐私与安全

- 密钥（如微信 DB key）只在内存内使用，**绝不落盘、绝不出设备、绝不入日志**。
- 提取是全产品**最敏感**的组件：以独立子进程/本地服务运行，与主进程边界清晰。
- 不 vendor 解密核心（同时规避法律与可持续性风险）。
- 法律：仅限个人导出自有数据；对违反平台 ToS / 跨境合规由用户自负，UI 给出明确知情提示。

## 9. 错误处理与降级链

- provider `isAvailable()` 为假（工具未装 / 客户端未登录 / 版本不匹配）→ 自动回退同平台下一档 → 最终回退手动兜底，并给清晰提示。
- 微信版本更新导致提取失败 → 明确报“工具与当前微信版本不兼容”，不静默失败。
- 转码/ASR 失败 → 保留原始资产 + 诊断信息，不丢数据。

## 10. 测试策略

- 现有 parser 单测继续覆盖各 `ImportFormat`。
- provider 选择：表驱动测试（`HardwareProfile` + 平台 → 期望 provider）。
- 各 `isAvailable()`/外部工具调用：mock。
- 微信真实端到端提取**无法进 CI**（需真实客户端/备份）：标注为手动验证项，提供 fixture（脱敏导出样本）做解析层回归。

## 11. 风险与待验证

1. **微信工具可持续性**：PyWxDump 已删库，工具会消失 → 松耦合 + 可替换是硬性架构要求。
2. **Mac 平台最弱**：成熟工具多 Windows 优先。**早期验证 chatlog 的 macOS 路径**；否则主打 iPhone 备份路线（WechatExporter 在 Mac 上解析备份）。
3. **微信 4.x 版本脆弱**：SQLCipher 4 加密随版本变化；钉住工具版本，预期升级即可能破。
4. **微信语音克隆质量**：能拿到 ≠ 能克隆好；UI 给真实预期。
5. **GPL 传染**：WechatExporter 为 GPL-2.0——以外部进程调用而非链接其代码（个人用途下风险低，但保持边界）。

## 12. 关键决策（已定）

- **D1 微信主/备路线**：provider 在运行时由 `isAvailable()` 自动择优，**无需用户选**。Mac 主路线 = **iPhone 备份解析**（WechatExporter 在 Mac 上可靠）；`chatlog` 在可用平台（Windows，及 Mac 若 Phase 0 spike 通过）优先；手动永远兜底。理由：不把架构押在未验证的 chatlog-mac 上，靠适配器吸收差异。
- **D2 OCR 本地链路**：**平台原生优先**（macOS/iOS 用 Apple Vision / 实况文本，Android 用 ML Kit——CJK 效果好且 on-device），**Tesseract.js 作浏览器跨平台兜底**。属通用 floor，弱机也能用，不依赖重模型。
- **D3 pack 跨设备同步**：v1 = **纯文件手动搬运**（导出 → AirDrop/网盘/U盘 → 导入），零新基建、最私密、贴 pack DNA。局域网/私有隧道同步**推迟**到 Spec A 的 `remote-host` 预留接口（YAGNI，不现在建）。

## 13. 与 Spec A 的接口

- 共用 `HardwareProfile`：采集分级（§4）= Spec A 档位探测的同一套探测结果。
- `AcquisitionProviderInfo.runtime` 与 Spec A 的 `ProviderInfo.runtime` 同源；未来 `remote-host` 运行时（手机连自有强机）由 Spec A 预留接口承载。

## 14. 实施流程（分阶段，先打不确定性）

每个阶段独立可交付，最早暴露风险。

- **Phase 0 — 去风险 spike（最先做）**：在 Mac 上实测 `chatlog` 与 `WechatExporter`(iPhone 备份) 哪条能通 → 据此锁定 Mac 主路线（落实 D1）；用一条真实微信语音条验证 `ffmpeg` SILK→WAV。时间盒,结果回填 spec。
- **Phase 1 — 采集骨架 + 稳路径**：新建 `packages/acquisition`（`AcquisitionProvider` 接口 + 注册表 + `isAvailable()` + 表驱动选择）；接通文件导入类 provider（WhatsApp/Telegram/iMessage/通用）端到端到 pack；手动兜底；`/acquisition/providers` 端点 + PWA 上传/粘贴 UI。**此阶段后“能用的人”已覆盖大半。**
- **Phase 2 — 微信管线（硬骨头）**：基于 Phase 0 结论实现选定的微信 provider（可替换外部适配器，桌面 host 专属）；语音 SILK→WAV；媒体入包；不可用时降级到手动。
- **Phase 3 — 语音采集供克隆**：PWA 麦克风录制 + 提取语音条；UI 给真实质量预期；参考音频交给 Spec A 的克隆 provider。
- **Phase 4 — OCR 兜底**：平台原生（Apple Vision / ML Kit）+ Tesseract.js 浏览器兜底，处理截图。

后续：Spec B 计划落地后 → 写 Spec A（能力分级）spec + 计划 → 生成 provider（SadTalker 等）接入。
