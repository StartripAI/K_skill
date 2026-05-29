import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  acquisitionProviders,
  ingest,
  selectAcquisitionProviders,
  type DeviceProfile
} from "../packages/acquisition/src/index.ts";

const browser: DeviceProfile = { os: "browser", isDesktopHost: false };
const mac: DeviceProfile = { os: "darwin", isDesktopHost: true };

describe("acquisition registry", () => {
  test("ships file-export and manual-paste providers, all local", () => {
    const ids = acquisitionProviders.map((provider) => provider.info.id);
    expect(ids).toContain("file-export");
    expect(ids).toContain("manual-paste");
    for (const provider of acquisitionProviders) {
      expect(provider.info.privacyLabel).toBe("local");
      expect(provider.info.local).toBe(true);
    }
  });
});

describe("acquisition selection", () => {
  test("file-export and manual-paste are available on any device", () => {
    expect(selectAcquisitionProviders(browser).map((info) => info.id)).toEqual(["file-export", "manual-paste"]);
  });

  test("platform filter keeps generic providers and drops mismatches", () => {
    const ids = selectAcquisitionProviders(mac, "whatsapp").map((info) => info.id);
    expect(ids).toContain("file-export");
    expect(ids).not.toContain("manual-paste");
  });
});

describe("acquisition ingest", () => {
  test("ingests an uploaded chat .txt into parsed sources via media", async () => {
    const bytes = new TextEncoder().encode("Alice: 在吗\nBob: 在的，刚下班");
    const result = await ingest({ kind: "file", file: { name: "chat-export.txt", bytes } }, mac);
    expect(result.providerId).toBe("file-export");
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0]?.messages.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  test("ingests pasted chat text into parsed sources", async () => {
    const result = await ingest(
      { kind: "paste", name: "pasted-chat.txt", text: "Alice: 周末有空吗\nBob: 有的，去看展？" },
      browser
    );
    expect(result.providerId).toBe("manual-paste");
    expect(result.sources.length).toBe(1);
    expect(result.sources[0]?.messages.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});

describe("acquisition wechat extract (swappable external command)", () => {
  test("is unavailable without the env var", () => {
    const previous = process.env.KSKILL_WECHAT_EXTRACT_COMMAND;
    delete process.env.KSKILL_WECHAT_EXTRACT_COMMAND;
    try {
      const ids = selectAcquisitionProviders(mac).map((info) => info.id);
      expect(ids).not.toContain("wechat-extract");
    } finally {
      if (previous !== undefined) process.env.KSKILL_WECHAT_EXTRACT_COMMAND = previous;
    }
  });

  test("runs the configured extract command and parses its output", async () => {
    const dir = mkdtempSync(join(tmpdir(), "kskill-wechat-"));
    const runner = join(dir, "extract.mjs");
    writeFileSync(
      runner,
      `
import { writeFileSync } from "node:fs";
let body = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (body += chunk));
process.stdin.on("end", () => {
  const input = JSON.parse(body);
  writeFileSync(input.outFile, "Alice: 在吗\\nBob: 在的，刚下班");
  process.exit(0);
});
`,
      "utf8"
    );
    const previous = process.env.KSKILL_WECHAT_EXTRACT_COMMAND;
    process.env.KSKILL_WECHAT_EXTRACT_COMMAND = `${process.execPath} ${runner}`;
    try {
      const result = await ingest({ kind: "extract", platform: "wechat" }, mac);
      expect(result.providerId).toBe("wechat-extract");
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources[0]?.messages.length ?? 0).toBeGreaterThanOrEqual(2);
    } finally {
      if (previous === undefined) delete process.env.KSKILL_WECHAT_EXTRACT_COMMAND;
      else process.env.KSKILL_WECHAT_EXTRACT_COMMAND = previous;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
