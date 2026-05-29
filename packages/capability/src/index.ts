import { spawnSync } from "node:child_process";
import { arch as osArch, cpus, totalmem } from "node:os";

export type Accelerator = "none" | "apple-mps" | "cuda";

export type HardwareProfile = {
  os: "darwin" | "win32" | "linux" | "browser";
  arch: "arm64" | "x64" | "other";
  cpuCores: number;
  ramGB: number;
  accelerator: Accelerator;
  vramGB?: number;
  pythonAvailable: boolean;
  ffmpegAvailable: boolean;
};

export type CapabilityTier = "T0" | "T1" | "T2" | "T3";
export type FeatureKind = "text" | "voice" | "video";
export type CapabilityFeatures = Record<FeatureKind, boolean>;

export type Capability = {
  profile: HardwareProfile;
  tier: CapabilityTier;
  features: CapabilityFeatures;
};

// Pure: derive the default tier from a hardware profile. Table-testable, no GPU needed.
export function resolveTier(profile: HardwareProfile): CapabilityTier {
  const cudaHq = profile.accelerator === "cuda" && (profile.vramGB ?? 0) >= 8;
  const appleHq = profile.accelerator === "apple-mps" && profile.ramGB >= 64;
  if (cudaHq || appleHq) return "T3";
  if (profile.os !== "browser" && profile.ramGB >= 16 && (profile.accelerator !== "none" || profile.cpuCores >= 8)) {
    return "T2";
  }
  if (profile.os !== "browser" && profile.ramGB >= 8 && profile.cpuCores >= 4) return "T1";
  return "T0";
}

// Pure: which feature families are available at a tier. Voice has a browser floor at T0,
// so it is always available; video unlocks at T2.
export function featuresForTier(tier: CapabilityTier): CapabilityFeatures {
  return {
    text: true,
    voice: true,
    video: tier === "T2" || tier === "T3"
  };
}

function commandExists(command: string): boolean {
  try {
    const probe =
      process.platform === "win32" ? spawnSync("where", [command]) : spawnSync("which", [command]);
    return probe.status === 0;
  } catch {
    return false;
  }
}

function detectCuda(): { cuda: boolean; vramGB?: number } {
  try {
    const result = spawnSync("nvidia-smi", ["--query-gpu=memory.total", "--format=csv,noheader,nounits"], {
      encoding: "utf8"
    });
    if (result.status === 0 && typeof result.stdout === "string") {
      const firstLine = result.stdout.split("\n")[0]?.trim() ?? "";
      const mb = Number.parseInt(firstLine, 10);
      return Number.isFinite(mb) ? { cuda: true, vramGB: Math.round(mb / 1024) } : { cuda: true };
    }
  } catch {
    // nvidia-smi absent → no CUDA
  }
  return { cuda: false };
}

// Best-effort server-side detection. The pure functions above carry the testable logic.
export function detectHardware(): HardwareProfile {
  const os: HardwareProfile["os"] =
    process.platform === "darwin" ? "darwin" : process.platform === "win32" ? "win32" : "linux";
  const detected = osArch();
  const arch: HardwareProfile["arch"] = detected === "arm64" ? "arm64" : detected === "x64" ? "x64" : "other";
  const cpuCores = cpus().length || 1;
  const ramGB = Math.round(totalmem() / 1024 ** 3);

  let accelerator: Accelerator = "none";
  let vramGB: number | undefined;
  if (os === "darwin" && arch === "arm64") {
    accelerator = "apple-mps";
  } else {
    const cuda = detectCuda();
    if (cuda.cuda) {
      accelerator = "cuda";
      vramGB = cuda.vramGB;
    }
  }

  const profile: HardwareProfile = {
    os,
    arch,
    cpuCores,
    ramGB,
    accelerator,
    pythonAvailable: commandExists("python3") || commandExists("python"),
    ffmpegAvailable: commandExists("ffmpeg")
  };
  if (vramGB !== undefined) profile.vramGB = vramGB;
  return profile;
}

export function serverCapability(): Capability {
  const profile = detectHardware();
  const tier = resolveTier(profile);
  return { profile, tier, features: featuresForTier(tier) };
}
