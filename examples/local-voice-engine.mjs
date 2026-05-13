#!/usr/bin/env node
import { writeFileSync } from "node:fs";

let body = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  body += chunk;
});

process.stdin.on("end", () => {
  const input = JSON.parse(body);
  const lines = [
    "KSKILL_LOCAL_VOICE_ENGINE",
    `voice=${input.voice ?? "memory"}`,
    `language=${input.language ?? "auto"}`,
    `reference=${input.referenceAudioPath ?? ""}`,
    `profile=${input.voiceProfilePath ?? ""}`,
    `text=${input.text ?? ""}`
  ];
  writeFileSync(input.outFile, `${lines.join("\n")}\n`);
  console.log(JSON.stringify({
    voiceId: input.voice ?? "memory-voice",
    durationMs: Math.max(1000, Math.ceil(String(input.text ?? "").length / 12) * 1000),
    mimeType: "audio/wav"
  }));
});
