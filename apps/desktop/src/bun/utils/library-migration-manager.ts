import { createReadStream, createWriteStream } from "fs";
import { mkdir, readdir, rename, rm, stat, unlink } from "fs/promises";
import { dirname, join } from "path";
import { bulkRewriteLocalPaths } from "../../db/queries";
import { closeDb, initDb } from "../../db/index";
import type { AppConfig } from "../../schema/config";
import type { DownloadProgressInfo, LibraryMigrationState } from "../../shared/types";
import { ConfigManager } from "./config-manager";
import {
  getDatabasePath,
  isNestedPath,
  isSamePath,
  normalizeLibraryPath,
  pathExists,
} from "./paths";
import { ZimManager } from "./zim-manager";

type MigrationMethod = "rename" | "copy";

type ManagedArtifact = {
  name: string;
  src: string;
  dest: string;
  size: number;
};

type MigrationRecord = {
  src: string;
  dest: string;
  method: MigrationMethod;
};

type MigrationDependencies = {
  configManager: ConfigManager;
  getConfig: () => AppConfig;
  getActiveDownloads: () => DownloadProgressInfo[];
  stopServices: () => Promise<void>;
  startServices: () => Promise<void>;
  emitProgress: (state: LibraryMigrationState) => void;
};

export class LibraryMigrationManager {
  private state: LibraryMigrationState;

  constructor(private readonly deps: MigrationDependencies) {
    this.state = {
      status: "idle",
      stage: "idle",
      currentPath: deps.getConfig().libraryPath,
      message: "Ready",
    };
  }

  getState(): LibraryMigrationState {
    if (this.state.status === "idle") {
      return {
        ...this.state,
        currentPath: this.deps.getConfig().libraryPath,
      };
    }

    return { ...this.state };
  }

  isRunning(): boolean {
    return this.state.status === "running";
  }

  async startLibraryMigration(nextLibraryPathRaw: string): Promise<{ accepted: true }> {
    if (this.isRunning()) {
      throw new Error("A library migration is already in progress.");
    }

    const currentPath = normalizeLibraryPath(this.deps.getConfig().libraryPath);
    const nextPath = normalizeLibraryPath(nextLibraryPathRaw);

    this.updateState({
      status: "running",
      stage: "validating",
      currentPath,
      nextPath,
      movedBytes: 0,
      totalBytes: 0,
      message: "Validating destination directory...",
      error: undefined,
    });

    try {
      await this.validatePaths(currentPath, nextPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.updateState({
        status: "error",
        stage: "error",
        currentPath,
        nextPath,
        message: "Library migration failed.",
        error: message,
      });
      throw error;
    }

    void this.executeMigration(currentPath, nextPath);
    return { accepted: true };
  }

  private async executeMigration(currentPath: string, nextPath: string) {
    const movedArtifacts: MigrationRecord[] = [];
    let dbRewritten = false;
    let configWritten = false;

    try {
      this.updateState({
        stage: "stopping_services",
        message: "Stopping services before moving files...",
      });
      await this.deps.stopServices();

      const artifacts = await this.collectManagedArtifacts(currentPath, nextPath);
      const totalBytes = artifacts.reduce((sum, artifact) => sum + artifact.size, 0);

      this.updateState({
        stage: "moving_files",
        movedBytes: 0,
        totalBytes,
        message: artifacts.length > 0 ? "Moving library files..." : "No managed files to move.",
      });

      let movedBytes = 0;
      for (const artifact of artifacts) {
        const record = await this.moveArtifact(artifact, (delta) => {
          movedBytes += delta;
          this.updateState({
            stage: "moving_files",
            movedBytes,
            totalBytes,
            message: `Moving ${artifact.name}...`,
          });
        });

        movedArtifacts.push(record);
      }

      this.updateState({
        stage: "updating_database",
        movedBytes,
        totalBytes,
        message: "Updating database file paths...",
      });

      initDb(getDatabasePath());
      try {
        bulkRewriteLocalPaths(currentPath, nextPath);
        dbRewritten = true;

        this.updateState({
          stage: "rewriting_library_xml",
          movedBytes,
          totalBytes,
          message: "Rebuilding library.xml...",
        });

        const zimManager = new ZimManager(nextPath);
        await zimManager.rebuildLibraryXmlFromDisk();
      } finally {
        closeDb();
      }

      this.updateState({
        stage: "writing_config",
        movedBytes,
        totalBytes,
        message: "Saving the new library location...",
      });

      await this.deps.configManager.setLibraryPath(nextPath);
      configWritten = true;

      this.updateState({
        stage: "restarting_services",
        movedBytes,
        totalBytes,
        message: "Restarting services...",
      });

      await this.deps.startServices();

      await rm(currentPath, { recursive: true, force: true }).catch((error) => {
        console.warn(
          "[LibraryMigrationManager] Failed to remove the old library directory:",
          error
        );
      });

      this.updateState({
        status: "completed",
        stage: "completed",
        currentPath: nextPath,
        nextPath,
        movedBytes,
        totalBytes,
        message: "Library directory updated successfully.",
        error: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await this.rollbackMigration({
        currentPath,
        nextPath,
        movedArtifacts,
        dbRewritten,
        configWritten,
      });

      this.updateState({
        status: "error",
        stage: "error",
        currentPath,
        nextPath,
        message: "Library migration failed.",
        error: message,
      });
    }
  }

  private async rollbackMigration({
    currentPath,
    nextPath,
    movedArtifacts,
    dbRewritten,
    configWritten,
  }: {
    currentPath: string;
    nextPath: string;
    movedArtifacts: MigrationRecord[];
    dbRewritten: boolean;
    configWritten: boolean;
  }) {
    try {
      await this.deps.stopServices();
    } catch (error) {
      console.warn("[LibraryMigrationManager] Failed to stop services during rollback:", error);
    }

    const appDataDbPath = getDatabasePath();
    if (dbRewritten && pathExists(appDataDbPath)) {
      try {
        initDb(appDataDbPath);
        bulkRewriteLocalPaths(nextPath, currentPath);
      } catch (error) {
        console.warn("[LibraryMigrationManager] Failed to reverse DB path rewrite:", error);
      } finally {
        closeDb();
      }
    }

    for (const artifact of movedArtifacts.reverse()) {
      try {
        await this.restoreArtifact(artifact);
      } catch (error) {
        console.warn(
          `[LibraryMigrationManager] Failed to restore ${artifact.dest} during rollback:`,
          error
        );
      }
    }

    if (configWritten) {
      try {
        await this.deps.configManager.setLibraryPath(currentPath);
      } catch (error) {
        console.warn("[LibraryMigrationManager] Failed to restore config after rollback:", error);
      }
    }

    try {
      await this.deps.startServices();
    } catch (error) {
      console.warn("[LibraryMigrationManager] Failed to restart services after rollback:", error);
    }
  }

  private async validatePaths(currentPath: string, nextPath: string) {
    if (!nextPath) {
      throw new Error("Library path cannot be empty.");
    }

    if (isSamePath(currentPath, nextPath)) {
      throw new Error("Choose a different library directory.");
    }

    if (isNestedPath(currentPath, nextPath) || isNestedPath(nextPath, currentPath)) {
      throw new Error("Library directories cannot be nested inside each other.");
    }

    const activeDownload = this.deps
      .getActiveDownloads()
      .some((download) => download.status === "downloading");
    if (activeDownload) {
      throw new Error("Wait for active downloads to finish before changing the library path.");
    }

    const destinationStat = await stat(nextPath).catch(() => undefined);
    if (destinationStat?.isFile()) {
      throw new Error("The selected destination points to a file, not a directory.");
    }

    if (destinationStat?.isDirectory()) {
      const entries = await readdir(nextPath);
      if (entries.length > 0) {
        throw new Error("The destination directory must be empty.");
      }
    }
  }

  private async collectManagedArtifacts(
    currentPath: string,
    nextPath: string
  ): Promise<ManagedArtifact[]> {
    const artifacts: ManagedArtifact[] = [];

    if (!pathExists(currentPath)) {
      return artifacts;
    }

    const entries = await readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".zim")) {
        continue;
      }

      const src = join(currentPath, entry.name);
      const fileInfo = await stat(src);
      artifacts.push({
        name: entry.name,
        src,
        dest: join(nextPath, entry.name),
        size: fileInfo.size,
      });
    }

    return artifacts;
  }

  private async moveArtifact(
    artifact: ManagedArtifact,
    onProgress: (delta: number) => void
  ): Promise<MigrationRecord> {
    await mkdir(dirname(artifact.dest), { recursive: true });

    try {
      await rename(artifact.src, artifact.dest);
      onProgress(artifact.size);

      return {
        src: artifact.src,
        dest: artifact.dest,
        method: "rename",
      };
    } catch (error: any) {
      if (error?.code !== "EXDEV") {
        throw error;
      }
    }

    try {
      await this.copyFileWithProgress(artifact.src, artifact.dest, onProgress);
      await unlink(artifact.src);
    } catch (error) {
      await rm(artifact.dest, { force: true }).catch(() => undefined);
      throw error;
    }

    return {
      src: artifact.src,
      dest: artifact.dest,
      method: "copy",
    };
  }

  private async restoreArtifact(artifact: MigrationRecord) {
    if (!pathExists(artifact.dest)) {
      return;
    }

    await mkdir(dirname(artifact.src), { recursive: true });

    if (artifact.method === "rename") {
      try {
        await rename(artifact.dest, artifact.src);
        return;
      } catch (error: any) {
        if (error?.code !== "EXDEV") {
          throw error;
        }
      }
    }

    await this.copyFileWithProgress(artifact.dest, artifact.src);
    await unlink(artifact.dest);
  }

  private async copyFileWithProgress(
    src: string,
    dest: string,
    onProgress?: (delta: number) => void
  ) {
    await mkdir(dirname(dest), { recursive: true });

    try {
      await new Promise<void>((resolve, reject) => {
        const reader = createReadStream(src);
        const writer = createWriteStream(dest);

        reader.on("data", (chunk: Buffer) => {
          onProgress?.(chunk.length);
        });
        reader.on("error", reject);
        writer.on("error", reject);
        writer.on("close", resolve);

        reader.pipe(writer);
      });
    } catch (error) {
      await rm(dest, { force: true }).catch(() => undefined);
      throw error;
    }

    const [srcStat, destStat] = await Promise.all([stat(src), stat(dest)]);
    if (srcStat.size !== destStat.size) {
      throw new Error(`Failed to verify copied file: ${dest}`);
    }
  }

  private updateState(partial: Partial<LibraryMigrationState>) {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.deps.emitProgress(this.getState());
  }
}
