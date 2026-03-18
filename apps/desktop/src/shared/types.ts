export type DownloadStatus = "downloading" | "completed" | "canceled" | "error";

export interface DownloadProgressInfo {
  id: string;
  filename: string;
  status: DownloadStatus;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  bytesPerSec: number;
  error?: string;
}

export interface StoreVariant {
  id: string;
  name: string;
  sizeStr: string;
  filename: string;
  url: string;
}

export interface StoreSite {
  id: string;
  name: string;
  description: string;
  icon: string;
  variants: StoreVariant[];
}

export interface StoreCatalog {
  sites: StoreSite[];
}

export interface LibraryBook {
  id: string;
  opdsId: string | null;
  name: string | null;
  title: string | null;
  summary: string | null;
  language: string | null;
  author: string | null;
  category: string | null;
  sizeBytes: number | null;
  downloadUrl: string | null;
  localPath: string | null;
  isDownloaded: boolean;
  updatedAt: Date | null;
}
