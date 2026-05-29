import { featuresForTier, resolveTier, type HardwareProfile } from "../packages/capability/src/index.ts";

function profile(overrides: Partial<HardwareProfile>): HardwareProfile {
  return {
    os: "linux",
    arch: "x64",
    cpuCores: 8,
    ramGB: 16,
    accelerator: "none",
    pythonAvailable: false,
    ffmpegAvailable: false,
    ...overrides
  };
}

describe("resolveTier", () => {
  test("browser-only / weak device → T0", () => {
    expect(resolveTier(profile({ os: "browser", arch: "other", cpuCores: 1, ramGB: 2 }))).toBe("T0");
  });

  test("modest CPU box → T1", () => {
    expect(resolveTier(profile({ ramGB: 8, cpuCores: 4, accelerator: "none" }))).toBe("T1");
  });

  test("16GB + 8 cores → T2 baseline video", () => {
    expect(resolveTier(profile({ ramGB: 16, cpuCores: 8 }))).toBe("T2");
  });

  test("NVIDIA with 12GB VRAM → T3", () => {
    expect(resolveTier(profile({ ramGB: 32, accelerator: "cuda", vramGB: 12 }))).toBe("T3");
  });

  test("NVIDIA with only 6GB VRAM stays below T3", () => {
    expect(resolveTier(profile({ ramGB: 32, cpuCores: 8, accelerator: "cuda", vramGB: 6 }))).toBe("T2");
  });

  test("Apple Silicon 64GB → T3 (MLX path)", () => {
    expect(resolveTier(profile({ os: "darwin", arch: "arm64", ramGB: 64, accelerator: "apple-mps" }))).toBe("T3");
  });

  test("Apple Silicon 16GB → T2", () => {
    expect(resolveTier(profile({ os: "darwin", arch: "arm64", ramGB: 16, accelerator: "apple-mps" }))).toBe("T2");
  });
});

describe("featuresForTier", () => {
  test("text and voice available at every tier; video unlocks at T2", () => {
    expect(featuresForTier("T0")).toEqual({ text: true, voice: true, video: false });
    expect(featuresForTier("T1").video).toBe(false);
    expect(featuresForTier("T2").video).toBe(true);
    expect(featuresForTier("T3").video).toBe(true);
  });
});
