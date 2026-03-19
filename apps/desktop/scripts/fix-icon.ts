import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(import.meta.dirname, "..");
const buildFolder = join(projectRoot, "build");

async function fixIcon() {
  if (!existsSync(buildFolder)) {
    console.log("Build folder does not exist yet.");
    return;
  }

  const targets = ["dev-win-x64", "stable-win-x64"];

  for (const target of targets) {
    const targetPath = join(buildFolder, target);
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
          const rceditPath = join(projectRoot, "node_modules", "rcedit", "bin", "rcedit-x64.exe");

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

fixIcon().catch(console.error);
