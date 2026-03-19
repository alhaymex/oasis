import type { RPCSchema } from "electrobun";
import type {
  CatalogSiteDetail,
  CatalogSiteSummary,
  CatalogVariantResult,
  DownloadProgressInfo,
  LibraryBook,
  LibraryMigrationState,
} from "./types";
import type { AppConfig } from "../schema/config";

export type AppRPCSchema = {
  bun: RPCSchema<{
    requests: {
      ping: {
        params: { msg: string };
        response: void;
      };
      getCatalogSites: {
        params: void;
        response: CatalogSiteSummary[];
      };
      getCatalogSite: {
        params: { siteId: string };
        response: CatalogSiteDetail | null;
      };
      searchCatalog: {
        params: { query: string; limit?: number };
        response: CatalogVariantResult[];
      };
      startDownload: {
        params: { id: string; url: string; filename: string };
        response: boolean;
      };
      getLocalLibrary: {
        params: void;
        response: LibraryBook[];
      };
      getActiveDownloads: {
        params: void;
        response: DownloadProgressInfo[];
      };
      getConfig: {
        params: void;
        response: AppConfig;
      };
      switchTheme: {
        params: { themeId: string };
        response: AppConfig;
      };
      startLibraryMigration: {
        params: { nextLibraryPath: string };
        response: { accepted: true };
      };
      getLibraryMigrationState: {
        params: void;
        response: LibraryMigrationState;
      };
    };
    messages: {};
  }>;

  webview: RPCSchema<{
    requests: {};
    messages: {
      onDownloadProgress: DownloadProgressInfo;
      onLibraryMigrationProgress: LibraryMigrationState;
    };
  }>;
};
