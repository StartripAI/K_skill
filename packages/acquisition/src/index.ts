import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseMediaFile, type MediaInputFile, type ParsedAsset } from "../../media/src/index.js";
import { parseImport, type ParsedSource } from "../../importers/src/index.js";

export type AcquisitionPlatform =
  | "whatsapp"
  | "telegram"
  | "imessage"
  | "wechat"
  | "qq"
  | "line"
  | "generic"
  | "manual";

export type AcquisitionMethod =
  | "file-export"
  | "local-api"
  | "device-backup"
  | "manual-paste"
  | "screenshot-ocr"
  | "mic-capture";

export type AcquisitionRuntime = "desktop-host" | "browser" | "any";

export type AcquisitionYield = "text" | "voice" | "image" | "video";

export type AcquisitionProviderInfo = {
  id: string;
  label: string;
  platform: AcquisitionPlatform;
  method: AcquisitionMethod;
  runtime: AcquisitionRuntime;
  yields: AcquisitionYield[];
  local: boolean;
  reliability: "robust" | "fragile" | "best-effort";
  external?: { tool: string; swappable: true };
  privacyLabel: "local";
};

export type DeviceProfile = {
  os: "darwin" | "win32" | "linux" | "browser";
  isDesktopHost: boolean;
};

export type AcquisitionDiagnostic = { severity: string; code: string; message: string };

export type AcquisitionInput =
  | { kind: "file"; file: MediaInputFile; platform?: AcquisitionPlatform }
  | { kind: "paste"; name: string; text: string; platform?: AcquisitionPlatform }
  | { kind: "extract"; platform: AcquisitionPlatform; contact?: string };

export type AcquisitionResult = {
  providerId: string;
  sources: ParsedSource[];
  assets: ParsedAsset[];
  diagnostics: AcquisitionDiagnostic[];
};

export interface AcquisitionProvider {
  info: AcquisitionProviderInfo;
  isAvailable(profile: DeviceProfile): boolean;
  acquire(input: AcquisitionInput): Promise<AcquisitionResult>;
}

// Platforms whose names are real importer formats and are safe to force.
const KNOWN_IMPORT_FORMATS: ReadonlyArray<AcquisitionPlatform> = ["whatsapp", "telegram", "imessage", "wechat", "qq"];

function forcedFormatFor(platform: AcquisitionPlatform | undefined): string | undefined {
  return platform && KNOWN_IMPORT_FORMATS.includes(platform) ? platform : undefined;
}

const fileExportProvider: AcquisitionProvider = {
  info: {
    id: "file-export",
    label: "File export import",
    platform: "generic",
    method: "file-export",
    runtime: "any",
    yields: ["text", "voice", "image", "video"],
    local: true,
    reliability: "robust",
    privacyLabel: "local"
  },
  isAvailable: () => true,
  async acquire(input) {
    if (input.kind !== "file") throw new Error("file-export provider requires a file input");
    const result = await parseMediaFile(input.file);
    return {
      providerId: "file-export",
      sources: result.sources,
      assets: result.assets,
      diagnostics: result.diagnostics.map((d) => ({ severity: d.severity, code: d.code, message: d.message }))
    };
  }
};

const manualPasteProvider: AcquisitionProvider = {
  info: {
    id: "manual-paste",
    label: "Manual paste",
    platform: "manual",
    method: "manual-paste",
    runtime: "any",
    yields: ["text"],
    local: true,
    reliability: "best-effort",
    privacyLabel: "local"
  },
  isAvailable: () => true,
  async acquire(input) {
    if (input.kind !== "paste") throw new Error("manual-paste provider requires a paste input");
    const result = parseImport({ name: input.name, text: input.text, forcedFormat: forcedFormatFor(input.platform) });
    const sources = result.import ? [result.import] : [];
    return { providerId: "manual-paste", sources, assets: [], diagnostics: [] };
  }
};

// WeChat / QQ have no clean export; extraction is delegated to an external, swappable
// command (chatlog / WechatExporter / etc.) configured via env — never vendored here.
// Mirrors the voice package's local-command adapter pattern.
function wechatExtractCommand(): string | undefined {
  return process.env.KSKILL_WECHAT_EXTRACT_COMMAND;
}

function splitCommand(commandLine: string): string[] {
  return commandLine.trim().split(/\s+/).filter(Boolean);
}

async function runExtractCommand(
  commandLine: string,
  request: { platform: string; contact: string },
  timeoutMs = 120000
): Promise<string> {
  const [command, ...args] = splitCommand(commandLine);
  if (!command) throw new Error("Empty extract command");
  const dir = mkdtempSync(join(tmpdir(), "kskill-acq-"));
  const outFile = join(dir, "export.txt");
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`extract command timed out after ${timeoutMs}ms`));
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
        reject(new Error(`extract command exited with ${code}: ${Buffer.concat(stderr).toString("utf8")}`));
        return;
      }
      resolvePromise();
    });
    child.stdin.end(JSON.stringify({ ...request, outFile }));
  });
  return readFileSync(outFile, "utf8");
}

const wechatExtractProvider: AcquisitionProvider = {
  info: {
    id: "wechat-extract",
    label: "WeChat / QQ local extraction",
    platform: "wechat",
    method: "local-api",
    runtime: "desktop-host",
    yields: ["text", "voice", "image"],
    local: true,
    reliability: "fragile",
    external: { tool: "KSKILL_WECHAT_EXTRACT_COMMAND", swappable: true },
    privacyLabel: "local"
  },
  isAvailable: (profile) => profile.isDesktopHost && Boolean(wechatExtractCommand()),
  async acquire(input) {
    if (input.kind !== "extract") throw new Error("wechat-extract provider requires an extract input");
    const commandLine = wechatExtractCommand();
    if (!commandLine) throw new Error("KSKILL_WECHAT_EXTRACT_COMMAND is not configured");
    const text = await runExtractCommand(commandLine, { platform: input.platform, contact: input.contact ?? "" });
    const result = parseImport({ name: `${input.platform}-export.txt`, text });
    return { providerId: "wechat-extract", sources: result.import ? [result.import] : [], assets: [], diagnostics: [] };
  }
};

export const acquisitionProviders: AcquisitionProvider[] = [fileExportProvider, manualPasteProvider, wechatExtractProvider];

export function selectAcquisitionProviders(profile: DeviceProfile, platform?: AcquisitionPlatform): AcquisitionProviderInfo[] {
  return acquisitionProviders
    .filter((provider) => provider.isAvailable(profile))
    .filter((provider) => !platform || provider.info.platform === platform || provider.info.platform === "generic")
    .map((provider) => provider.info);
}

export async function ingest(input: AcquisitionInput, profile: DeviceProfile): Promise<AcquisitionResult> {
  const available = acquisitionProviders.filter((provider) => provider.isAvailable(profile));
  const provider =
    input.kind === "file"
      ? available.find((candidate) => candidate.info.method === "file-export")
      : input.kind === "paste"
        ? available.find((candidate) => candidate.info.method === "manual-paste")
        : available.find(
            (candidate) =>
              candidate.info.platform === input.platform &&
              (candidate.info.method === "local-api" || candidate.info.method === "device-backup")
          );
  if (!provider) {
    const detail = input.kind === "extract" ? ` and platform "${input.platform}"` : "";
    throw new Error(`No acquisition provider available for input kind "${input.kind}"${detail}`);
  }
  return provider.acquire(input);
}

export function serverDeviceProfile(): DeviceProfile {
  const os: DeviceProfile["os"] =
    process.platform === "darwin" ? "darwin" : process.platform === "win32" ? "win32" : "linux";
  return { os, isDesktopHost: true };
}
