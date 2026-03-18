import { defineConfig } from "drizzle-kit";
import { join } from "path";
import os from "os";
import { readFileSync, existsSync } from "fs";

function getDatabasePath() {
  const home = os.homedir();
  let configDir = "";
  if (process.platform === "win32") {
    configDir = join(process.env.APPDATA || join(home, "AppData", "Roaming"), "oasis");
  } else if (process.platform === "darwin") {
    configDir = join(home, "Library", "Application Support", "oasis");
  } else {
    configDir = join(process.env.XDG_CONFIG_HOME || join(home, ".config"), "oasis");
  }

  let libraryPath = join(home, "oasis-library");
  const configPath = join(configDir, "config.json");

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      if (config.libraryPath) libraryPath = config.libraryPath;
    } catch (e) {
      // ignore
    }
  }

  return join(libraryPath, "oasis.sqlite");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: getDatabasePath(),
  },
});
