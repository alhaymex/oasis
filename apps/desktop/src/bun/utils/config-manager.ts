import { join } from "path";
import type { Stats } from "fs";
import { rename, stat } from "fs/promises";
import { AppConfig, AppConfigSchema, Theme } from "../../schema/config";
import { DEFAULT_CONFIG } from "./defaults";
import { getConfigDir, getLibraryPath, ensureDir } from "./paths";

const APP_DATA_DIR = getConfigDir();
const BOOTSTRAP_PATH = join(APP_DATA_DIR, "bootstrap.json");
const CONFIG_PATH = join(APP_DATA_DIR, "config.json");
const LEGACY_CONFIG_FILENAME = "config.json";

async function readJsonFile(path: string): Promise<unknown | undefined> {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    return undefined;
  }

  try {
    return await file.json();
  } catch (error) {
    console.warn(`[ConfigManager] Failed to parse JSON at ${path}:`, error);
    return undefined;
  }
}

async function fileStat(path: string): Promise<Stats | undefined> {
  try {
    return await stat(path);
  } catch {
    return undefined;
  }
}

export async function loadPersistedConfig(): Promise<AppConfig> {
  ensureDir(APP_DATA_DIR);

  const appDataRaw = await readJsonFile(CONFIG_PATH);
  if (appDataRaw) {
    const parsed = AppConfigSchema.safeParse(appDataRaw);
    if (parsed.success) {
      return parsed.data;
    }

    console.warn(
      "[ConfigManager] AppData config validation failed, attempting legacy fallback.",
      parsed.error.format()
    );
  }

  let libraryPath = getLibraryPath();
  const bootstrapRaw = await readJsonFile(BOOTSTRAP_PATH);
  if (
    bootstrapRaw &&
    typeof bootstrapRaw === "object" &&
    bootstrapRaw !== null &&
    "libraryPath" in bootstrapRaw &&
    typeof bootstrapRaw.libraryPath === "string"
  ) {
    libraryPath = bootstrapRaw.libraryPath;
  }

  const legacyConfigPath = join(libraryPath, LEGACY_CONFIG_FILENAME);
  const legacyStat = await fileStat(legacyConfigPath);
  let merged: unknown = { ...DEFAULT_CONFIG, libraryPath };

  if (legacyStat?.isFile()) {
    const legacyRaw = await readJsonFile(legacyConfigPath);
    if (legacyRaw && typeof legacyRaw === "object") {
      merged = { ...(merged as Record<string, unknown>), ...legacyRaw };
    }
  }

  const parsed = AppConfigSchema.safeParse(merged);
  if (parsed.success) {
    return parsed.data;
  }

  console.warn(
    "[ConfigManager] Falling back to defaults after failing to load config.",
    parsed.error.format()
  );

  return AppConfigSchema.parse({
    ...DEFAULT_CONFIG,
    libraryPath,
  });
}

export class ConfigManager {
  private config: AppConfig = DEFAULT_CONFIG;
  private currentLibraryPath: string = getLibraryPath();

  async init(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    const nextConfig = await loadPersistedConfig();
    this.config = nextConfig;
    this.currentLibraryPath = nextConfig.libraryPath;
    await this.save();
  }

  private async save(): Promise<void> {
    ensureDir(APP_DATA_DIR);
    const tmp = CONFIG_PATH + ".tmp";
    await Bun.write(tmp, JSON.stringify(this.config, null, 2));
    await rename(tmp, CONFIG_PATH);
  }

  // Public API
  getConfig(): AppConfig {
    return structuredClone(this.config);
  }

  async setLibraryPath(libraryPath: string): Promise<void> {
    this.currentLibraryPath = libraryPath;
    await this.updateConfig({ libraryPath });
  }

  async updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
    const merged = { ...this.config, ...partial };
    const parsed = AppConfigSchema.safeParse(merged);

    if (!parsed.success) {
      throw new Error(`[ConfigManager] Invalid config: ${JSON.stringify(parsed.error.format())}`);
    }

    this.config = parsed.data;

    if (partial.libraryPath && partial.libraryPath !== this.currentLibraryPath) {
      this.currentLibraryPath = partial.libraryPath;
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
