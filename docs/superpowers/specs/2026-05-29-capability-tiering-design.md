# Spec A — 能力分级 & 跨平台适配 (Capability Tiering & Cross-Platform Adaptation)

- 项目: K_skill (StartripAI/K_skill)
- 日期: 2026-05-29
- 状态: Draft（待用户评审）
- 关联: Spec B — 数据采集 & 移植管线（共用 `HardwareProfile`）

## 1. 目标与范围

让 K_skill 在**差异极大的设备**上都能用：从只有浏览器的老旧手机/平板，到带 NVIDIA 显卡的桌面。按设备能力**分级（tier）**，逐级解锁功能（文字 → 语音 → 视频），并**优雅降级**——没人被锁死，强机不浪费。全程**本地/离线、不上云、不依赖远程 GPU**。

范围内：硬件探测、档位解析、功能 gate、按平台/加速器选择生成 provider。
范围外：数据采集/微信提取（Spec B）；具体视频/语音模型的封装实现（各 provider 的 plan）。

## 2. 设计原则

1. **本地优先**：所有档位都在用户自己的设备上跑；云端 / 远程 GPU 不在选项内。算力上限对标“能和本地编码 IDE（CC/Codex）并存的程度”。
2. **统一基线 + 加速器解锁**（已定）：所有平台共享一个可移植基线；检测到 NVIDIA（或大内存 Apple Silicon）才解锁高清档。维护可控，又不浪费强硬件。
3. **自动探测 + 可手动调**（已定）：启动探测给默认档，用户可上/下调；选超出硬件的档给明确警告但放行。
4. **优雅降级**：功能不可用就回退下一档并给清晰提示，不静默失败；探测失败兜底到最低档。

## 3. HardwareProfile（探测）

服务端（Node）启动时探测一次并缓存：

```ts
type Accelerator = "none" | "apple-mps" | "cuda";
type HardwareProfile = {
  os: "darwin" | "win32" | "linux" | "browser";
  arch: "arm64" | "x64" | "other";
  cpuCores: number;
  ramGB: number;            // Apple Silicon 统一内存计入此处
  accelerator: Accelerator;
  vramGB?: number;          // CUDA 时填
  pythonAvailable: boolean; // 生成模型多为 Python 子进程
  ffmpegAvailable: boolean;
};
```

探测方式：Mac 用 `sysctl`（CPU/内存/芯片）；Windows 用 `wmic` / `nvidia-smi`；Linux 用 `/proc` + `nvidia-smi`。CUDA 经 `nvidia-smi` 判定并取显存。浏览器端（纯 PWA 客户端）`os="browser"`、`accelerator="none"`。

> 与 Spec B 共用同一 `HardwareProfile`：采集分级（哪台设备能跑微信提取）与功能分级用同一探测结果。

## 4. 档位矩阵（T0–T3）

档位累加（高档含低档全部能力）；**语音、视频各自在档内降级**。每档以“它能扛的最重功能”定义：

| 档 | 触发条件（默认） | 文字 | 语音(TTS/ASR) | 视频 |
|---|---|---|---|---|
| **T0 文字档** | 任何设备（含浏览器/老旧机） | ✅ persona 聊天 | 浏览器原生 SpeechSynthesis / WebSpeech（零安装） | — |
| **T1 本地语音档** | ~≥4 核 / ≥8GB | ✅ | 本地 Piper TTS + whisper.cpp ASR（离线） | — |
| **T2 基线视频档** | ≥16GB；Apple Silicon / 像样 CPU / 任意 N 卡 | ✅ | + 本地声音克隆 | **SadTalker**（CPU/MPS/CUDA 通吃，单图+TTS音频） |
| **T3 高清档** | N 卡 ≥~8–12GB 显存 **或** Apple Silicon ≥64GB | ✅ | （最佳克隆） | N卡→EchoMimicV3/LivePortrait；Mac64GB→Phosphene/LTX-2 MLX |

要点：T2 的 **SadTalker 即“到处都能跑”的统一基线**；T3 是“检测到强加速器才解锁”的分支。**只要聊天+语音的用户天然停在 T0/T1，视频根本不出现在 UI 里**（不支持的功能直接隐藏，非置灰）。

## 5. 档位解析与覆写

```ts
type CapabilityTier = "T0" | "T1" | "T2" | "T3";
function resolveTier(profile: HardwareProfile): CapabilityTier;   // 纯函数，表驱动
```

- `resolveTier` 由 `HardwareProfile` 推默认档（纯函数，便于单测，CI 不需要 GPU）。
- 用户可在设置里手动上/下调；选超出硬件档给明确警告（“可能很慢/失败”）但放行。
- 探测失败 → 兜底 T0。可选“首跑微基准”确认机器真扛得住，扛不住自动降档。

## 6. 功能 gate 与 provider 选择

- 复用并泛化现有 `voice` 的 provider 注册表：把 `VoiceProviderInfo` 升级为共享 `ProviderInfo`，新增字段：`accelerator: Array<"cpu"|"mps"|"cuda">`、`minRamGB?`、`minVramGB?`、`featureKind: "voice" | "avatar"`。
- `selectProvider(featureKind, tier, profile)`：在“当前档允许 + 硬件满足 + 加速器匹配”的 provider 里选最优；缺失则回退下一档。
- 视频生成 provider（各自独立 plan 实现，均为外部子进程 / 本地 HTTP，仓库内不含模型代码/权重）：
  - `sadtalker-local-command`（T2，cpu/mps/cuda）
  - `echomimic-cuda` / `liveportrait-cuda`（T3，cuda）
  - `phosphene-mlx-http`（T3，mps，≥64GB）
- 服务端暴露 `GET /api/capabilities`：返回 `{ profile, tier, features }`，PWA 据此显隐 Video / 语音选项（不支持的隐藏）。CLI 加 `kskill capability` 打印探测档。

## 7. 与现有代码集成

- 新增 `packages/capability`：`detectHardware()`、`resolveTier(profile)`、`selectProvider(...)`、`serverCapability()`。
- `voice` 包的 `VoiceProviderInfo` 重构为共享 `ProviderInfo`（加 accelerator/min* 字段）；现有 `local`/`requiresNetwork`/`privacyLabel` 保留。
- 视频生成走 `packages/avatar`（独立 plan），`AvatarProvider` 复用同一 `ProviderInfo` 形状。
- `server`：`/api/capabilities` 端点 + 各生成端点按档 gate。`apps/web`：按 `/api/capabilities` 显隐功能。

## 8. 错误处理与降级

- provider 不可用（模型/二进制缺失、显存不足）→ 回退同 featureKind 的下一档 provider → 最终回退“该功能在本机不可用”的明确提示。
- 手动选超档 → 警告但允许；运行失败给可读错误，不静默。
- 探测异常 → T0 兜底。

## 9. 测试策略

- `resolveTier()` 纯函数：用合成 `HardwareProfile` 表（各 OS×加速器×内存组合 → 期望档）做单测，**CI 不需要真实 GPU**。
- `selectProvider()`：表驱动测试（档 + 加速器 + featureKind → 期望 providerId）。
- 各 OS 探测适配器：mock。
- 真实 GPU/模型端到端：标注为手动验证项。

## 10. 与 Spec B 的接口

- 共用 `HardwareProfile`：Spec B 的“采集分级”（桌面 host 才能跑微信提取）与本 spec 的“功能分级”用同一探测结果与 `isDesktopHost`/accelerator 判定。
- `ProviderInfo.runtime`（`desktop-host` | `browser` | `any`）两 spec 同源；未来手机连自有强机的 `remote-host` 运行时由本 spec 的 provider 选择层承载（默认不启用）。

## 11. 实施顺序（建议）

1. `packages/capability`：`HardwareProfile` + `detectHardware()`（各 OS）+ `resolveTier()`（纯函数，先连同单测）。
2. `ProviderInfo` 泛化 + `selectProvider()` + `/api/capabilities` + PWA 显隐。
3. `packages/avatar` + `sadtalker-local-command`（T2 基线，先打通本地链路）。
4. T3 provider：`phosphene-mlx-http`（Mac）/ `echomimic-cuda`（N卡），按用户硬件分别接。
