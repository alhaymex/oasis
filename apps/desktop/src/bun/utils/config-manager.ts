import os from "os";
import { join } from "path";
import { mkdir, rename } from "fs/promises";
import { AppConfig, AppConfigSchema, Theme } from "../../schema/config";
import { DEFAULT_CONFIG } from "./defaults";
import { getConfigDir, getLibraryPath, ensureDir } from "./paths";

// this is where we store the
const APP_DATA_DIR = getConfigDir();
const BOOTSTRAP_PATH = join(APP_DATA_DIR, "bootstrap.json");

export class ConfigManager {
  private config: AppConfig = DEFAULT_CONFIG;
  private currentLibraryPath: string = getLibraryPath();

  async init(): Promise<void> {
    await this.loadBootstrap();
    await this.load();
  }

  private getFullConfigPath(): string {
    return join(this.currentLibraryPath, "config.json");
  }

  private async loadBootstrap(): Promise<void> {
    ensureDir(APP_DATA_DIR);
    const file = Bun.file(BOOTSTRAP_PATH);
    if (await file.exists()) {
      try {
        const data = await file.json();
        if (data.libraryPath) {
          this.currentLibraryPath = data.libraryPath;
          this.config.libraryPath = data.libraryPath;
        }
      } catch (e) {
        console.error("[ConfigManager] Failed to load bootstrap config:", e);
      }
    } else {
        await this.saveBootstrap();
    }
  }

  private async saveBootstrap(): Promise<void> {
    ensureDir(APP_DATA_DIR);
    await Bun.write(BOOTSTRAP_PATH, JSON.stringify({ libraryPath: this.currentLibraryPath }, null, 2));
  }

  private async load(): Promise<void> {
    const configPath = this.getFullConfigPath();
    ensureDir(this.currentLibraryPath);
    
    const file = Bun.file(configPath);
    const exists = await file.exists();

    if (!exists) {
      console.warn(`[ConfigManager] No config found at ${configPath}, creating defaults.`);
      await this.save();
      return;
    }

    let raw: unknown;
    try {
      raw = await file.json();
    } catch {
      console.warn("[ConfigManager] Corrupted JSON detected, resetting config.")
      this.config = { ...DEFAULT_CONFIG, libraryPath: this.currentLibraryPath };
      await this.save();
      return;
    }

    const parsed = AppConfigSchema.safeParse(raw);

    if (parsed.success) {
      this.config = parsed.data;
      // Ensure the config's libraryPath stays in sync with our current boostrap path
      if (this.config.libraryPath !== this.currentLibraryPath) {
          this.currentLibraryPath = this.config.libraryPath;
          await this.saveBootstrap();
      }
    } else {
      console.warn(
        "[ConfigManager] Config validation failed, resetting to defaults.",
        parsed.error.format()
      );
      this.config = { ...DEFAULT_CONFIG, libraryPath: this.currentLibraryPath };
      await this.save();
    }
  }

  private async save(): Promise<void> {
    const configPath = this.getFullConfigPath();
    ensureDir(this.currentLibraryPath);
    
    const tmp = configPath + ".tmp";
    await Bun.write(tmp, JSON.stringify(this.config, null, 2));
    await rename(tmp, configPath);
  }

  // Public API
  getConfig(): AppConfig {
    return structuredClone(this.config);
  }

  async setLibraryPath(libraryPath: string): Promise<void> {
    this.currentLibraryPath = libraryPath;
    await this.updateConfig({ libraryPath });
    await this.saveBootstrap();
  }

  async updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
    const merged = { ...this.config, ...partial };
    const parsed = AppConfigSchema.safeParse(merged);

    if (!parsed.success) {
      throw new Error(`[ConfigManager] Invalid config: ${JSON.stringify(parsed.error.format())}`);
    }

    this.config = parsed.data;
    
    // If libraryPath changed in the partial, we need to update our internal tracker and bootstrap
    if (partial.libraryPath && partial.libraryPath !== this.currentLibraryPath) {
        this.currentLibraryPath = partial.libraryPath;
        await this.saveBootstrap();
    }

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
