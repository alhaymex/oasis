import { Updater } from "electrobun/bun";
import type { AppUpdateState } from "../../shared/types";
import type { ConfigManager } from "./config-manager";

type CheckForUpdatesOptions = {
  autoDownload?: boolean;
  silent?: boolean;
};

const DEFAULT_STATE: AppUpdateState = {
  status: "idle",
  autoUpdateEnabled: true,
  currentVersion: "0.0.0",
  updateAvailable: false,
  updateReady: false,
};

function nowIsoString() {
  return new Date().toISOString();
}

export class UpdateManager {
  private state: AppUpdateState = DEFAULT_STATE;

  constructor(private readonly configManager: ConfigManager) {}

  getState(): AppUpdateState {
    return structuredClone(this.state);
  }

  syncAutoUpdateSetting() {
    const config = this.configManager.getConfig();
    this.state = {
      ...this.state,
      autoUpdateEnabled: config.autoUpdate,
    };
  }

  async initialize() {
    this.syncAutoUpdateSetting();

    try {
      this.state = {
        ...this.state,
        currentVersion: await Updater.localInfo.version(),
        currentHash: await Updater.localInfo.hash(),
      };
    } catch (error) {
      this.state = {
        ...this.state,
        status: "error",
        error: error instanceof Error ? error.message : "Failed to read local updater state.",
      };
    }
  }

  async checkForUpdates({
    autoDownload = false,
    silent = false,
  }: CheckForUpdatesOptions = {}): Promise<AppUpdateState> {
    this.syncAutoUpdateSetting();

    if (!(await this.hasInternetConnection())) {
      this.state = {
        ...this.state,
        status: "offline",
        updateAvailable: false,
        updateReady: false,
        message: silent
          ? "Skipped update check while offline."
          : "No internet connection detected.",
        error: undefined,
        lastCheckedAt: nowIsoString(),
      };
      return this.getState();
    }

    this.state = {
      ...this.state,
      status: "checking",
      message: "Checking for updates...",
      error: undefined,
    };

    try {
      const info = await Updater.checkForUpdate();

      this.state = {
        ...this.state,
        latestVersion: info.version,
        latestHash: info.hash,
        updateAvailable: Boolean(info.updateAvailable),
        updateReady: Boolean(info.updateReady),
        error: info.error || undefined,
        lastCheckedAt: nowIsoString(),
      };

      if (info.error) {
        this.state = {
          ...this.state,
          status: "error",
          message: "Update check failed.",
        };
        return this.getState();
      }

      if (info.updateReady) {
        this.state = {
          ...this.state,
          status: "ready",
          message: `Update v${info.version} is ready to install.`,
        };
        return this.getState();
      }

      if (!info.updateAvailable) {
        this.state = {
          ...this.state,
          status: "up_to_date",
          message: "You are on the latest version.",
        };
        return this.getState();
      }

      this.state = {
        ...this.state,
        status: autoDownload ? "downloading" : "available",
        message: autoDownload
          ? `Downloading update v${info.version}...`
          : `Update v${info.version} is available.`,
      };

      if (!autoDownload) {
        return this.getState();
      }

      await Updater.downloadUpdate();
      const readyInfo = Updater.updateInfo?.() ?? (await Updater.checkForUpdate());

      this.state = {
        ...this.state,
        latestVersion: readyInfo.version || this.state.latestVersion,
        latestHash: readyInfo.hash || this.state.latestHash,
        updateAvailable: Boolean(readyInfo.updateAvailable),
        updateReady: Boolean(readyInfo.updateReady),
        error: readyInfo.error || undefined,
        status: readyInfo.updateReady ? "ready" : readyInfo.error ? "error" : "available",
        message: readyInfo.updateReady
          ? `Update v${readyInfo.version} is ready to install.`
          : readyInfo.error
            ? "Failed to download update."
            : `Update v${readyInfo.version} is available.`,
        lastCheckedAt: nowIsoString(),
      };

      return this.getState();
    } catch (error) {
      this.state = {
        ...this.state,
        status: "error",
        error: error instanceof Error ? error.message : "Unexpected update error.",
        message: "Update check failed.",
        lastCheckedAt: nowIsoString(),
      };

      return this.getState();
    }
  }

  async applyUpdate() {
    const info = Updater.updateInfo?.();
    if (!info?.updateReady) {
      throw new Error("No update is ready to install.");
    }

    await Updater.applyUpdate();
  }

  async runAutoUpdateOnLaunch() {
    this.syncAutoUpdateSetting();

    if (!this.state.autoUpdateEnabled) {
      return this.getState();
    }

    return this.checkForUpdates({ autoDownload: true, silent: true });
  }

  private async hasInternetConnection() {
    try {
      const baseUrl = await Updater.localInfo.baseUrl();
      const origin = new URL(baseUrl).origin;
      const response = await fetch(origin, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
