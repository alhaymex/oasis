import { spawnSync as _spawnSync } from "node:child_process";
import { existsSync as _existsSync, readdirSync as _readdirSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(import.meta.dirname, "..");
const buildFolder = join(projectRoot, "build");

export interface FixIconDeps {
  existsSync?: (path: string) => boolean;
  readdirSync?: (path: string) => string[];
  spawnSync?: (cmd: string, args: string[], opts: { stdio: string }) => { status: number | null };
  buildFolder?: string;
  projectRoot?: string;
}

export async function fixIcon(deps: FixIconDeps = {}) {
  const existsSync = deps.existsSync ?? _existsSync;
  const readdirSync = deps.readdirSync ?? _readdirSync;
  const spawnSync = deps.spawnSync ?? _spawnSync;
  const resolvedBuildFolder = deps.buildFolder ?? buildFolder;
  const resolvedProjectRoot = deps.projectRoot ?? projectRoot;

  if (!existsSync(resolvedBuildFolder)) {
    console.log("Build folder does not exist yet.");
    return;
  }

  const targets = ["dev-win-x64", "stable-win-x64"];

  for (const target of targets) {
    const targetPath = join(resolvedBuildFolder, target);
    if (!existsSync(targetPath)) continue;

    console.log(`Checking target: ${target}`);

    const iconPath = join(targetPath, "temp-launcher-icon.ico");
    if (!existsSync(iconPath)) {
      console.warn(`Icon not found: ${iconPath}`);
      continue;
    }

    const possibleAppDirs = readdirSync(targetPath).filter((f) => f.startsWith("Oasis"));

    for (const appDirName of possibleAppDirs) {
      const binDir = join(targetPath, appDirName, "bin");
      if (!existsSync(binDir)) continue;

      const executables = ["launcher.exe", "launcher", "bun.exe", "bun"];

      for (const exeName of executables) {
        const exePath = join(binDir, exeName);
        if (existsSync(exePath)) {
          console.log(`Embedding icon into: ${exePath}`);

          // Run rcedit
          // Use local rcedit from node_modules
          const rceditPath = join(resolvedProjectRoot, "node_modules", "rcedit", "bin", "rcedit-x64.exe");

          if (!existsSync(rceditPath)) {
            console.error(`rcedit not found at: ${rceditPath}`);
            continue;
          }

          const result = spawnSync(rceditPath, [exePath, "--set-icon", iconPath], {
            stdio: "inherit",
          });

          if (result.status === 0) {
            console.log(`Successfully embedded icon into ${exeName}`);
          } else {
            console.error(`Failed to embed icon into ${exeName}`);
          }
        }
      }
    }
  }
}

if (import.meta.main) {
  fixIcon().catch(console.error);
}