import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist/packages/cli/src/index.js");
const content = `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const entry = resolve(root, "packages/cli/src/index.ts");
const tsx = resolve(root, "node_modules/.bin/tsx");
const result = spawnSync(tsx, [entry, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

process.exit(result.status ?? 1);
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, content, "utf8");
console.log(`Built CLI wrapper at ${out}`);
