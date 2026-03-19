import { join } from "path";
import { copyFile, rename, unlink } from "fs/promises";
import { db, closeDb, initDb } from "../db/index";
import { runMigrations } from "../db/migrate";
import type { DownloadProgressInfo, LibraryMigrationState } from "../shared/types";
import { KiwixServer } from "./utils/kiwix-server";
import { ConfigManager } from "./utils/config-manager";
import { ZimDownloader } from "./utils/download-manager";
import { LibraryMigrationManager } from "./utils/library-migration-manager";
import { getDatabasePath, getConfigDir, ensureDir, pathExists } from "./utils/paths";
import { UpdateManager } from "./utils/update-manager";
import { ZimManager } from "./utils/zim-manager";

const LEGACY_DB_FILENAME = "oasis.sqlite";

export class AppRuntime {
  private readonly configManager = new ConfigManager();
  private readonly updateManager = new UpdateManager(this.configManager);
  private readonly kiwixServer = new KiwixServer();
  private readonly migrationManager = new LibraryMigrationManager({
    configManager: this.configManager,
    getConfig: () => this.configManager.getConfig(),
    getActiveDownloads: () => this.getActiveDownloads(),
    stopServices: () => this.stopServices(),
    startServices: () => this.startServices(),
    emitProgress: (state) => {
      this.migrationProgressCallback?.(state);
    },
  });

  private zimManager?: ZimManager;
  private zimDownloader?: ZimDownloader;
  private downloadProgressCallback?: (progress: DownloadProgressInfo) => void;
  private migrationProgressCallback?: (state: LibraryMigrationState) => void;
  private configLoaded = false;

  async startServices() {
    await this.ensureConfigLoaded();
    await this.updateManager.initialize();

    const config = this.configManager.getConfig();
    await this.ensureDatabaseLocation(config.libraryPath);
    initDb(getDatabasePath());

    try {
      await runMigrations(db);
    } catch (error) {
      console.error("[db] Auto-migration failed:", error);
    }

    this.zimManager = new ZimManager(config.libraryPath);
    this.zimDownloader = new ZimDownloader(this.zimManager);
    this.zimDownloader.setProgressCallback(this.downloadProgressCallback);

    await this.zimManager.rebuildLibraryXmlFromDisk();

    this.kiwixServer.stop();
    this.kiwixServer.start(this.zimManager.getLibraryXmlPath());

    const isOnline = await this.kiwixServer.waitForReady();
    if (!isOnline) {
      this.kiwixServer.stop();
      throw new Error("Failed to connect to kiwix-serve.");
    }
  }

  async stopServices() {
    this.kiwixServer.stop();
    this.zimDownloader?.setProgressCallback(undefined);
    this.zimDownloader = undefined;
    this.zimManager = undefined;
    closeDb();
  }

  getConfigManager() {
    return this.configManager;
  }

  getUpdateManager() {
    return this.updateManager;
  }

  getMigrationManager() {
    return this.migrationManager;
  }

  getActiveDownloads(): DownloadProgressInfo[] {
    return this.zimDownloader?.getActiveDownloads() ?? [];
  }

  async startDownload(id: string, url: string, filename: string): Promise<boolean> {
    if (this.migrationManager.isRunning()) {
      return false;
    }

    if (!this.zimDownloader) {
      throw new Error("Download service is not ready.");
    }

    await this.zimDownloader.startDownload(id, url, filename);
    return true;
  }

  setDownloadProgressCallback(cb?: (progress: DownloadProgressInfo) => void) {
    this.downloadProgressCallback = cb;
    this.zimDownloader?.setProgressCallback(cb);
  }

  setMigrationProgressCallback(cb?: (state: LibraryMigrationState) => void) {
    this.migrationProgressCallback = cb;
  }

  private async ensureConfigLoaded() {
    if (this.configLoaded) {
      return;
    }

    await this.configManager.init();
    this.configLoaded = true;
  }

  private async ensureDatabaseLocation(libraryPath: string) {
    const appDataDbPath = getDatabasePath();
    if (pathExists(appDataDbPath)) {
      return;
    }

    const legacyDbPath = join(libraryPath, LEGACY_DB_FILENAME);
    if (!pathExists(legacyDbPath)) {
      ensureDir(getConfigDir());
      return;
    }

    ensureDir(getConfigDir());

    try {
      await rename(legacyDbPath, appDataDbPath);
    } catch (error: any) {
      if (error?.code !== "EXDEV") {
        throw error;
      }

      await copyFile(legacyDbPath, appDataDbPath);
      await unlink(legacyDbPath);
    }
  }
}

export const runtime = new AppRuntime();
