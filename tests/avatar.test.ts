import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HardwareProfile } from "../packages/capability/src/index.ts";
import { renderAvatar, selectAvatarProviders } from "../packages/avatar/src/index.ts";

const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

function profile(overrides: Partial<HardwareProfile>): HardwareProfile {
  return {
    os: "linux",
    arch: "x64",
    cpuCores: 8,
    ramGB: 16,
    accelerator: "none",
    pythonAvailable: true,
    ffmpegAvailable: true,
    ...overrides
  };
}

const t2cpu = profile({ ramGB: 16, cpuCores: 8 }); // resolves to T2
const t1box = profile({ ramGB: 8, cpuCores: 4 }); // resolves to T1

describe("avatar provider selection", () => {
  test("command-based talking-head providers require their env command", () => {
    const previous = process.env.KSKILL_AVATAR_COMMAND;
    delete process.env.KSKILL_AVATAR_COMMAND;
    try {
      expect(selectAvatarProviders(t2cpu).map((info) => info.id)).not.toContain("sadtalker-local-command");
    } finally {
      if (previous !== undefined) process.env.KSKILL_AVATAR_COMMAND = previous;
    }
  });

  test("ffmpeg static-portrait floor is available at T1+ when ffmpeg is present", () => {
    expect(selectAvatarProviders(t2cpu).map((info) => info.id)).toContain("ffmpeg-static-portrait");
    expect(selectAvatarProviders(t1box).map((info) => info.id)).toContain("ffmpeg-static-portrait");
    expect(selectAvatarProviders(profile({ ffmpegAvailable: false })).map((info) => info.id)).not.toContain(
      "ffmpeg-static-portrait"
    );
  });

  test("SadTalker unlocks at T2 (not T1) when its command is configured", () => {
    const previous = process.env.KSKILL_AVATAR_COMMAND;
    process.env.KSKILL_AVATAR_COMMAND = "noop";
    try {
      expect(selectAvatarProviders(t2cpu).map((info) => info.id)).toContain("sadtalker-local-command");
      expect(selectAvatarProviders(t1box).map((info) => info.id)).not.toContain("sadtalker-local-command");
    } finally {
      if (previous === undefined) delete process.env.KSKILL_AVATAR_COMMAND;
      else process.env.KSKILL_AVATAR_COMMAND = previous;
    }
  });
});

describe("avatar render", () => {
  test("talking-head provider runs the configured external model command", async () => {
    const dir = mkdtempSync(join(tmpdir(), "kskill-avatar-test-"));
    const runner = join(dir, "model.mjs");
    writeFileSync(
      runner,
      `
import { writeFileSync } from "node:fs";
let body = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (body += chunk));
process.stdin.on("end", () => {
  const input = JSON.parse(body);
  writeFileSync(input.outFile, Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]));
  process.exit(0);
});
`,
      "utf8"
    );
    const previous = process.env.KSKILL_AVATAR_COMMAND;
    process.env.KSKILL_AVATAR_COMMAND = `${process.execPath} ${runner}`;
    try {
      const video = await renderAvatar(
        { imageBytes: new Uint8Array([1, 2, 3]), audioBytes: new Uint8Array([4, 5, 6]), providerId: "sadtalker-local-command" },
        t2cpu
      );
      expect(video.providerId).toBe("sadtalker-local-command");
      expect(video.mimeType).toBe("video/mp4");
      expect(video.bytes.length).toBeGreaterThan(0);
      expect(video.sha256).toHaveLength(64);
    } finally {
      if (previous === undefined) delete process.env.KSKILL_AVATAR_COMMAND;
      else process.env.KSKILL_AVATAR_COMMAND = previous;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test.skipIf(!hasFfmpeg)("ffmpeg floor produces a real mp4 from a photo + audio", async () => {
    const dir = mkdtempSync(join(tmpdir(), "kskill-ffmpeg-test-"));
    const png = join(dir, "in.png");
    const wav = join(dir, "in.wav");
    spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=blue:s=64x64:d=1", "-frames:v", "1", png], { stdio: "ignore" });
    spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", wav], { stdio: "ignore" });
    try {
      const video = await renderAvatar(
        {
          imageBytes: new Uint8Array(readFileSync(png)),
          audioBytes: new Uint8Array(readFileSync(wav)),
          providerId: "ffmpeg-static-portrait"
        },
        t2cpu
      );
      expect(video.providerId).toBe("ffmpeg-static-portrait");
      expect(video.mimeType).toBe("video/mp4");
      expect(video.bytes.length).toBeGreaterThan(200); // a real, non-trivial mp4
      // mp4 files carry an "ftyp" box near the start
      expect(new TextDecoder().decode(video.bytes.slice(0, 12))).toContain("ftyp");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
