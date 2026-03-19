import { chmod, rm, mkdir } from "fs/promises";
import { join } from "path";
import { BIN_DIR, TMP_DIR, getBinPath, pathExists, ensureDir } from "./paths";

type OS = "win32" | "linux" | "darwin";
type Arch = "x64" | "arm64";
type PlatformKey = `${OS}-${Arch}`;

interface EngineConfig {
  url: string;
  extractPath: string;
  finalName: string;
}

const CONFIG: Record<string, EngineConfig> = {
  "win32-x64": {
    url: "https://github.com/alhaymex/oasis/releases/download/oasis-v1.0.0/kiwix-serve-win-x64.exe",
    extractPath: "kiwix-serve.exe",
    finalName: "kiwix-serve-win.exe",
  },
  "linux-x64": {
    url: "https://github.com/alhaymex/oasis/releases/download/oasis-v1.0.0/kiwix-serve-linux-x64",
    extractPath: "kiwix-serve-linux",
    finalName: "kiwix-serve-linux",
  },
  "linux-arm64": {
    url: "https://gnibgle18wv7h7vq.public.blob.vercel-storage.com/kiwix-serve-linux-arm64",
    extractPath: "kiwix-serve-linux",
    finalName: "kiwix-serve-linux",
  },
  "darwin-x64": {
    url: "https://gnibgle18wv7h7vq.public.blob.vercel-storage.com/kiwix-serve-darwin-x64",
    extractPath: "kiwix-serve-darwin",
    finalName: "kiwix-serve-darwin",
  },
  "darwin-arm64": {
    url: "https://github.com/alhaymex/oasis/releases/download/oasis-v1.0.0/kiwix-serve-macos-arm64",
    extractPath: "kiwix-serve-darwin",
    finalName: "kiwix-serve-darwin",
  },
};

const currOS = process.platform as OS;
const currArch = process.arch as Arch;
const platormKey: PlatformKey = `${currOS}-${currArch}`;

const target = CONFIG[platormKey];

if (!target) {
  throw new Error(`Unsuported platform: ${platormKey}`);
}

export async function isEngineInstalled(): Promise<boolean> {
  return pathExists(getBinPath(target.finalName));
}

export async function installEngine(onStatusUpdate?: (msg: string) => void) {
  if (await isEngineInstalled()) {
    onStatusUpdate?.("Engine already installed!");
    return;
  }

  ensureDir(BIN_DIR);
  ensureDir(TMP_DIR);

  const downloadFilePath = join(TMP_DIR, target.extractPath);
  const finalDest = getBinPath(target.finalName);

  onStatusUpdate?.(`Downloading engine for ${platormKey}...`);

  const response = await fetch(target.url);
  if (!response.ok) throw new Error("Failed to download engine from Kiwix mirror.");

  await Bun.write(downloadFilePath, response);

  onStatusUpdate?.("Finalizing installation...");

  const fileData = await Bun.file(downloadFilePath).arrayBuffer();
  await Bun.write(finalDest, fileData);

  if (currOS !== "win32") {
    await chmod(finalDest, 0o755);
  }

  await rm(TMP_DIR, { recursive: true, force: true });
  onStatusUpdate?.("✅ Installation complete!");
}

if (import.meta.main) {
  installEngine(console.log).catch(console.error);
}
