import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
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

export const PROJECT_ROOT = findProjectRoot(__dirname);
export const isDesktopApp = existsSync(join(PROJECT_ROOT, "apps", "desktop", "package.json"));
export const APP_ROOT = isDesktopApp ? join(PROJECT_ROOT, "apps", "desktop") : PROJECT_ROOT;
export const BIN_DIR = join(APP_ROOT, "bin");
export const TMP_DIR = join(APP_ROOT, ".tmp-engine");
export const DEFAULT_LIBRARY_DIR = join(os.homedir(), "oasis-library");

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
