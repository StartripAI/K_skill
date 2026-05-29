#!/usr/bin/env node
// Wav2Lip adapter for K_skill's local-command avatar provider.
//
// Reads {"imageFile","audioFile","outFile"} as JSON on stdin (the contract the
// avatar package's external-command provider sends) and renders a lip-synced mp4
// to outFile by driving a local Wav2Lip install. No model code/weights live in
// this repo — point it at an install via env:
//
//   KSKILL_WAV2LIP_DIR     path to the cloned Wav2Lip repo (with inference.py)
//   KSKILL_WAV2LIP_PYTHON  python interpreter of the Wav2Lip venv
//   KSKILL_WAV2LIP_CKPT    optional checkpoint path (default <dir>/wav2lip_gan.pth)
//
// Wire it up:  export KSKILL_AVATAR_COMMAND="node /abs/scripts/avatar/wav2lip-adapter.mjs"
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

let body = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (body += chunk));
process.stdin.on("end", () => {
  let req;
  try {
    req = JSON.parse(body);
  } catch {
    console.error("wav2lip-adapter: invalid JSON on stdin");
    process.exit(2);
  }
  const dir = process.env.KSKILL_WAV2LIP_DIR;
  const python = process.env.KSKILL_WAV2LIP_PYTHON;
  if (!dir || !python) {
    console.error("wav2lip-adapter: set KSKILL_WAV2LIP_DIR and KSKILL_WAV2LIP_PYTHON");
    process.exit(3);
  }
  const checkpoint = process.env.KSKILL_WAV2LIP_CKPT || join(dir, "wav2lip_gan.pth");
  const result = spawnSync(
    python,
    [
      "inference.py",
      "--checkpoint_path", checkpoint,
      "--face", req.imageFile,
      "--audio", req.audioFile,
      "--outfile", req.outFile,
      "--resize_factor", "2",
      "--nosmooth",
      "--fps", "25"
    ],
    { cwd: dir, stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, PYTHONWARNINGS: "ignore" } }
  );
  if (result.status !== 0 || !existsSync(req.outFile)) {
    console.error("wav2lip-adapter: render failed");
    process.exit(result.status || 1);
  }
});
