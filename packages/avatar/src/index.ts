import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveTier, type CapabilityTier, type HardwareProfile } from "../../capability/src/index.js";

export type AvatarProviderId =
  | "ffmpeg-static-portrait"
  | "talkinghead-local-command"
  | "echomimic-cuda"
  | "phosphene-mlx";
export type AvatarAccelerator = "cpu" | "mps" | "cuda";

export type AvatarProviderInfo = {
  id: AvatarProviderId;
  label: string;
  accelerator: AvatarAccelerator[];
  minTier: CapabilityTier;
  local: boolean;
  external: { tool: string; swappable: true };
  privacyLabel: "local";
};

export type AvatarRenderInput = {
  imageBytes: Uint8Array;
  audioBytes: Uint8Array;
  providerId?: AvatarProviderId;
};

export type AvatarVideo = {
  providerId: AvatarProviderId;
  bytes: Uint8Array;
  mimeType: string;
  sha256: string;
};

export interface AvatarProvider {
  info: AvatarProviderInfo;
  isAvailable(profile: HardwareProfile): boolean;
  render(input: AvatarRenderInput): Promise<AvatarVideo>;
}

// Each provider shells out to an external, swappable model command (env-configured) —
// no model code or weights vendored. Same pattern as the voice local-command adapter.
const ENV: Partial<Record<AvatarProviderId, string>> = {
  "talkinghead-local-command": "KSKILL_AVATAR_COMMAND",
  "echomimic-cuda": "KSKILL_AVATAR_COMMAND_CUDA",
  "phosphene-mlx": "KSKILL_PHOSPHENE_COMMAND"
};

const TIER_RANK: Record<CapabilityTier, number> = { T0: 0, T1: 1, T2: 2, T3: 3 };

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function commandFor(id: AvatarProviderId): string | undefined {
  const key = ENV[id];
  return key ? process.env[key] : undefined;
}

function mapAccelerator(accelerator: HardwareProfile["accelerator"]): AvatarAccelerator {
  return accelerator === "cuda" ? "cuda" : accelerator === "apple-mps" ? "mps" : "cpu";
}

function splitCommand(commandLine: string): string[] {
  return commandLine.trim().split(/\s+/).filter(Boolean);
}

async function runAvatarCommand(
  commandLine: string,
  imageBytes: Uint8Array,
  audioBytes: Uint8Array,
  timeoutMs = 600000
): Promise<Uint8Array> {
  const [command, ...args] = splitCommand(commandLine);
  if (!command) throw new Error("Empty avatar command");
  const dir = mkdtempSync(join(tmpdir(), "kskill-avatar-"));
  const imageFile = join(dir, "face.png");
  const audioFile = join(dir, "voice.wav");
  const outFile = join(dir, "talking.mp4");
  writeFileSync(imageFile, imageBytes);
  writeFileSync(audioFile, audioBytes);
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`avatar command timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    const stderr: Buffer[] = [];
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`avatar command exited with ${code}: ${Buffer.concat(stderr).toString("utf8")}`));
        return;
      }
      resolvePromise();
    });
    child.stdin.end(JSON.stringify({ imageFile, audioFile, outFile }));
  });
  return new Uint8Array(readFileSync(outFile));
}

function makeProvider(info: AvatarProviderInfo): AvatarProvider {
  return {
    info,
    isAvailable(profile) {
      const tier = resolveTier(profile);
      const accelerator = mapAccelerator(profile.accelerator);
      return (
        TIER_RANK[tier] >= TIER_RANK[info.minTier] &&
        info.accelerator.includes(accelerator) &&
        Boolean(commandFor(info.id))
      );
    },
    async render(input) {
      const commandLine = commandFor(info.id);
      if (!commandLine) throw new Error(`${ENV[info.id]} is not configured`);
      const bytes = await runAvatarCommand(commandLine, input.imageBytes, input.audioBytes);
      return { providerId: info.id, bytes, mimeType: "video/mp4", sha256: sha256(bytes) };
    }
  };
}

// Real, no-model, no-GPU video floor: loops the photo over the audio into an mp4 via
// ffmpeg. Produces a genuine "speaking portrait" clip on any machine that has ffmpeg —
// the graceful-degradation baseline below the talking-head models.
async function runFfmpegStaticPortrait(
  imageBytes: Uint8Array,
  audioBytes: Uint8Array,
  timeoutMs = 120000
): Promise<Uint8Array> {
  const dir = mkdtempSync(join(tmpdir(), "kskill-ffmpeg-"));
  const imageFile = join(dir, "face.png");
  const audioFile = join(dir, "voice.wav");
  const outFile = join(dir, "portrait.mp4");
  writeFileSync(imageFile, imageBytes);
  writeFileSync(audioFile, audioBytes);
  const args = [
    "-loop", "1", "-i", imageFile,
    "-i", audioFile,
    "-c:v", "libx264", "-tune", "stillimage",
    "-c:a", "aac", "-b:a", "192k",
    "-pix_fmt", "yuv420p", "-shortest", "-y", outFile
  ];
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`ffmpeg timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    const stderr: Buffer[] = [];
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with ${code}: ${Buffer.concat(stderr).toString("utf8")}`));
        return;
      }
      resolvePromise();
    });
  });
  return new Uint8Array(readFileSync(outFile));
}

const ffmpegStaticPortrait: AvatarProvider = {
  info: {
    id: "ffmpeg-static-portrait",
    label: "Static portrait clip (ffmpeg, no model / no GPU)",
    accelerator: ["cpu", "mps", "cuda"],
    minTier: "T1",
    local: true,
    external: { tool: "ffmpeg", swappable: true },
    privacyLabel: "local"
  },
  isAvailable: (profile) => TIER_RANK[resolveTier(profile)] >= TIER_RANK.T1 && profile.ffmpegAvailable,
  async render(input) {
    const bytes = await runFfmpegStaticPortrait(input.imageBytes, input.audioBytes);
    return { providerId: "ffmpeg-static-portrait", bytes, mimeType: "video/mp4", sha256: sha256(bytes) };
  }
};

// Ordered best-quality first; ffmpeg static portrait is the universal floor (last resort).
export const avatarProviders: AvatarProvider[] = [
  makeProvider({
    id: "phosphene-mlx",
    label: "Phosphene / LTX-2 MLX (HQ, Apple Silicon)",
    accelerator: ["mps"],
    minTier: "T3",
    local: true,
    external: { tool: "KSKILL_PHOSPHENE_COMMAND", swappable: true },
    privacyLabel: "local"
  }),
  makeProvider({
    id: "echomimic-cuda",
    label: "EchoMimic V3 (HQ, NVIDIA)",
    accelerator: ["cuda"],
    minTier: "T3",
    local: true,
    external: { tool: "KSKILL_AVATAR_COMMAND_CUDA", swappable: true },
    privacyLabel: "local"
  }),
  makeProvider({
    id: "talkinghead-local-command",
    label: "Local talking-head model (external command: Wav2Lip / SadTalker / EchoMimic)",
    accelerator: ["cpu", "mps", "cuda"],
    minTier: "T2",
    local: true,
    external: { tool: "KSKILL_AVATAR_COMMAND", swappable: true },
    privacyLabel: "local"
  }),
  ffmpegStaticPortrait
];

export function selectAvatarProviders(profile: HardwareProfile): AvatarProviderInfo[] {
  return avatarProviders.filter((provider) => provider.isAvailable(profile)).map((provider) => provider.info);
}

export async function renderAvatar(input: AvatarRenderInput, profile: HardwareProfile): Promise<AvatarVideo> {
  const candidates = avatarProviders.filter((provider) => provider.isAvailable(profile));
  const provider = input.providerId
    ? candidates.find((candidate) => candidate.info.id === input.providerId)
    : candidates[0];
  if (!provider) {
    throw new Error("No avatar provider available at this tier/accelerator (configure a model command)");
  }
  return provider.render(input);
}
