import { join } from "path";
import { DownloadProgressInfo } from "../../shared/types";
import { getLibraryPath } from "./paths";
import { ZimManager } from "./zim-manager";
import { rename } from "fs/promises";
import { updateBookDownloadStatus } from "../../db/queries";

export class ZimDownloader {
  private libraryPath: string;
  private zimManager: ZimManager;
  private activeDownloads: Map<string, DownloadProgressInfo> = new Map();
  private progressCallback?: (progress: DownloadProgressInfo) => void;

  constructor(zimManager: ZimManager) {
    this.libraryPath = getLibraryPath();
    this.zimManager = zimManager;
  }

  public setProgressCallback(cb: (progress: DownloadProgressInfo) => void) {
    this.progressCallback = cb;
  }

  public getActiveDownloads(): DownloadProgressInfo[] {
    return Array.from(this.activeDownloads.values());
  }

  public async startDownload(id: string, url: string, filename: string) {
    // prevent duplicates
    if (this.activeDownloads.has(id)) {
      const existing = this.activeDownloads.get(id);
      if (existing?.status === "downloading") return;
    }

    const info: DownloadProgressInfo = {
      id,
      filename,
      status: "downloading",
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      bytesPerSec: 0,
    };

    this.activeDownloads.set(id, info);
    this.notifyProgress(info);

    const tmpFilePath = join(this.libraryPath, `${filename}.tmp`);
    const finalPath = join(this.libraryPath, filename);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("File not found");
      }

      const contentLength = Number(response.headers.get("content-length"));
      info.totalBytes = contentLength;

      const fileWriter = Bun.file(tmpFilePath).writer();
      const reader = response.body.getReader();

      let downloaded = 0;
      let lastReportTime = performance.now();
      let bytesSinceLastReport = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          fileWriter.write(value);
          downloaded += value.length;
          bytesSinceLastReport = value.length;

          const now = performance.now();
          const timeSinceLastReport = now - lastReportTime;

          // 500ms throttle
          if (timeSinceLastReport > 500) {
            info.downloadedBytes = downloaded;
            info.progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            info.bytesPerSec = (bytesSinceLastReport / timeSinceLastReport) * 100;

            this.notifyProgress(info);
            lastReportTime = now;
            bytesSinceLastReport = 0;
          }
        }
      }

      await fileWriter.end();

      // rename the tmp file to .zim
      await rename(tmpFilePath, finalPath);

      info.status = "completed";
      info.progress = 100;
      info.downloadedBytes = downloaded;
      info.bytesPerSec = 0;

      this.notifyProgress(info);

      // Update DB status
      try {
        await updateBookDownloadStatus(filename, true, finalPath);
      } catch (err) {
        console.error(`[ZimDownloader] Failed to update DB status for ${filename}:`, err);
      }

      this.zimManager.addBookToXml(filename);
    } catch (error: any) {
      info.status = "error";
      info.error = error.message || "Failed to download file";
      info.bytesPerSec = 0;
      this.notifyProgress(info);
    }
  }

  private notifyProgress(info: DownloadProgressInfo) {
    if (this.progressCallback) {
      this.progressCallback({ ...info });
    }
  }
}
