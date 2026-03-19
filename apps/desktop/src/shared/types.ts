export type DownloadStatus = "downloading" | "completed" | "canceled" | "error";

export type LibraryMigrationStage =
  | "idle"
  | "validating"
  | "stopping_services"
  | "moving_files"
  | "updating_database"
  | "rewriting_library_xml"
  | "writing_config"
  | "restarting_services"
  | "completed"
  | "error";

export interface LibraryMigrationState {
  status: "idle" | "running" | "completed" | "error";
  stage: LibraryMigrationStage;
  currentPath: string;
  nextPath?: string;
  movedBytes?: number;
  totalBytes?: number;
  message?: string;
  error?: string;
}

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

export interface CatalogSiteSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  variantCount: number;
}

export interface CatalogVariantResult {
  id: string;
  siteId: string;
  siteName: string;
  siteIcon: string;
  siteDescription: string;
  name: string;
  filename: string;
  downloadUrl: string;
  sizeLabel: string;
  sizeBytes: number | null;
  isDownloaded: boolean;
}

export interface CatalogSiteDetail extends CatalogSiteSummary {
  variants: CatalogVariantResult[];
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

export interface FavoriteBook extends LibraryBook {
  favoritedAt: Date | null;
}

export interface NoteRecord {
  id: string;
  bookId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  selectedText: string | null;
  body: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type AppUpdateStatus =
  | "idle"
  | "checking"
  | "offline"
  | "up_to_date"
  | "available"
  | "downloading"
  | "ready"
  | "error";

export interface AppUpdateState {
  status: AppUpdateStatus;
  autoUpdateEnabled: boolean;
  currentVersion: string;
  currentHash?: string;
  latestVersion?: string;
  latestHash?: string;
  updateAvailable: boolean;
  updateReady: boolean;
  message?: string;
  error?: string;
  lastCheckedAt?: string;
}
