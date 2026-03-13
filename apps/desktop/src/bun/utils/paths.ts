import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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
export const LIBRARY_DIR = join(APP_ROOT, "library");

export function getBinPath(binaryName: string): string {
  return join(BIN_DIR, binaryName);
}

export function getLibraryPath(): string {
  return LIBRARY_DIR;
}

export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function pathExists(path: string): boolean {
  return existsSync(path);
}
