import { chmodSync, existsSync } from "node:fs";

const cli = new URL("../dist/packages/cli/src/index.js", import.meta.url);
if (existsSync(cli)) {
  chmodSync(cli, 0o755);
}
