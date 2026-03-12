import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import { chmod, rm } from "fs/promises";
import { dirname, join } from "path";
import extractZip from "extract-zip";
import * as tar from "tar";

const __dirname = dirname(fileURLToPath(import.meta.url));

function findProjectRoot(startPath: string): string {
  let current = startPath;
  while (current !== dirname(current)) {
    if (existsSync(join(current, "package.json"))) {
      return current;
    }
    current = dirname(current);
  }
  return startPath;
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const isDesktopApp = existsSync(join(PROJECT_ROOT, "apps", "desktop", "package.json"));
const APP_ROOT = isDesktopApp ? join(PROJECT_ROOT, "apps", "desktop") : PROJECT_ROOT;
const BIN_DIR = join(APP_ROOT, "bin");
const TMP_DIR = join(APP_ROOT, ".tmp-engine");

const CONFIG = {
  win32: {
    url: "https://download.kiwix.org/release/kiwix-tools/kiwix-tools_win-i686.zip",
    type: "zip",
    extractPath: "kiwix-serve.exe",
    finalName: "kiwix-serve-win.exe",
  },
  darwin: {
    url: "https://download.kiwix.org/release/kiwix-tools/kiwix-tools_win-i686.zip",
    type: "zip",
    extractPath: "kiwix-tools_win-i686/kiwix-serve.exe",
    finalName: "kiwix-serve-win.exe",
  },
  linux: {
    url: "https://download.kiwix.org/release/kiwix-tools/kiwix-tools_win-i686.zip",
    type: "zip",
    extractPath: "kiwix-tools_win-i686/kiwix-serve.exe",
    finalName: "kiwix-serve-win.exe",
  },
};

const currOS = process.platform as "win32" | "darwin" | "linux";
const target = CONFIG[currOS];

export async function isEngineInstalled(): Promise<boolean> {
  return existsSync(join(BIN_DIR, target.finalName));
}

export async function installEngine(onStatusUpdate?: (msg: string) => void) {
  if (await isEngineInstalled()) {
    onStatusUpdate?.("Engine already installed!");
    return;
  }

  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR);
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR);

  const archivePath = join(TMP_DIR, `engine.${target.type}`);
  const finalDest = join(BIN_DIR, target.finalName);

  onStatusUpdate?.(`Downloading engine for ${currOS}...`);
  const response = await fetch(target.url);
  if (!response.ok) throw new Error("Failed to download engine from Kiwix mirror.");
  await Bun.write(archivePath, response);

  onStatusUpdate?.("Extracting archive...");
  if (target.type === "zip") {
    await extractZip(archivePath, { dir: TMP_DIR });
  } else {
    await tar.x({ file: archivePath, cwd: TMP_DIR });
  }

  onStatusUpdate?.("Installing core engine...");
  const extractedFile = join(TMP_DIR, target.extractPath);
  const fileData = await Bun.file(extractedFile).arrayBuffer();
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
