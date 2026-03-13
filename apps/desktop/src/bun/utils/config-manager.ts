import { join } from "path";
import os from "os";
import { AppConfig, AppConfigSchema, Theme } from "../../schema/config";
import { DEFAULT_CONFIG } from "./defaults";

const CONFIG_DIR = join(os.homedir(), ".config", "oasis");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export class ConfigManager {
  private config: AppConfig = DEFAULT_CONFIG;

  async init(): Promise<void> {}

  // Helpers
  private async ensureConfigDir(): Promise<void> {
    await Bun.spawn(["mkdir", "-p", CONFIG_DIR]).exited;
  }

  private async Load(): Promise<void> {
    const file = Bun.file(CONFIG_PATH);
    const exists = await file.exists();

    if (!exists) {
      console.warn("[ConfigManager] No config found, creating defaults.");
      await this.save();
      return;
    }

    const raw = await file.json();
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
    await Bun.write(CONFIG_PATH, JSON.stringify(this.config, null, 2));
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
