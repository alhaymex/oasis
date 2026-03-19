import { existsSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import os from "os";

export { join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function findProjectRoot(startPath: string): string {
  let current = startPath;
  while (current !== dirname(current)) {
    if (existsSync(join(current, "package.json"))) {
      return current;
    }
    current = dirname(current);
  }
  return startPath;
}

export function getConfigDir(): string {
  const home = os.homedir();
  switch (process.platform) {
    case "win32":
      return join(process.env.APPDATA || join(home, "AppData", "Roaming"), "oasis");
    case "darwin":
      return join(home, "Library", "Application Support", "oasis");
    default:
      return join(process.env.XDG_CONFIG_HOME || join(home, ".config"), "oasis");
  }
}

const packagedAppRoot = resolve(dirname(process.execPath), "..", "Resources", "app");
const sourceProjectRoot = findProjectRoot(__dirname);
const sourceAppRoot = existsSync(join(sourceProjectRoot, "apps", "desktop", "package.json"))
  ? join(sourceProjectRoot, "apps", "desktop")
  : null;

export const IS_PACKAGED_APP = sourceAppRoot === null && existsSync(join(packagedAppRoot, "bun"));
export const PROJECT_ROOT = sourceProjectRoot;
export const APP_ROOT = sourceAppRoot ?? packagedAppRoot;
export const BIN_DIR = IS_PACKAGED_APP ? join(getConfigDir(), "bin") : join(APP_ROOT, "bin");
export const TMP_DIR = IS_PACKAGED_APP
  ? join(getConfigDir(), ".tmp-engine")
  : join(APP_ROOT, ".tmp-engine");
export const DEFAULT_LIBRARY_DIR = join(os.homedir(), "oasis-library");

export function getBinPath(binaryName: string): string {
  return join(BIN_DIR, binaryName);
}

export function getLibraryPath(override?: string): string {
  return override ?? DEFAULT_LIBRARY_DIR;
}

export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function pathExists(path: string): boolean {
  return existsSync(path);
}
