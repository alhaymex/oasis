import os from "os";
import { join } from "path";
import { mkdir, rename } from "fs/promises";
import { AppConfig, AppConfigSchema, Theme } from "../../schema/config";
import { DEFAULT_CONFIG } from "./defaults";

const CONFIG_DIR = getConfigDir();
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

function getConfigDir(): string {
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

export class ConfigManager {
  private config: AppConfig = DEFAULT_CONFIG;

  async init(): Promise<void> {
    await this.ensureConfigDir();
    await this.load();
  }

  // Helpers
  private async ensureConfigDir(): Promise<void> {
    await mkdir(CONFIG_DIR, { recursive: true });
  }

  private async load(): Promise<void> {
    const file = Bun.file(CONFIG_PATH);
    const exists = await file.exists();

    if (!exists) {
      console.warn("[ConfigManager] No config found, creating defaults.");
      await this.save();
      return;
    }

    let raw: unknown;

    try {
      raw = await file.json();
    } catch {
      console.warn("[ConfigManager] Corrupted JSON detected, resseting config.")
      this.config = DEFAULT_CONFIG;
      await this.save();
      return;
    }

    const parsed = AppConfigSchema.safeParse(raw);

    if (parsed.success) {
      this.config = parsed.data;
    } else {
      console.warn(
        "[ConfigManager] Config validation failed, resetting to defaults.",
        parsed.error.format()
      );
      await this.save();
    }
  }

  private async save(): Promise<void> {
    const tmp = CONFIG_PATH + ".tmp";

    await Bun.write(tmp, JSON.stringify(this.config, null, 2));
    await rename(tmp, CONFIG_PATH);
  }

  // Public API
  getConfig(): AppConfig {
    return structuredClone(this.config);
  }

  async setLibraryPath(libraryPath: string): Promise<void> {
    await this.updateConfig({
      libraryPath,
    });
  }

  async updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
    const merged = { ...this.config, ...partial };
    const parsed = AppConfigSchema.safeParse(merged);

    if (!parsed.success) {
      throw new Error(`[ConfigManager] Invalid config: ${JSON.stringify(parsed.error.format())}`);
    }

    this.config = parsed.data;
    await this.save();
    return this.getConfig();
  }

  async switchTheme(themeId: string): Promise<Theme> {
    const theme = this.config.theme.themes.find((t) => t.id === themeId);

    if (!theme) throw new Error(`[ConfigManager] Theme "${themeId}" not found!`);

    await this.updateConfig({
      theme: { ...this.config.theme, active: themeId },
    });

    return theme;
  }
}
