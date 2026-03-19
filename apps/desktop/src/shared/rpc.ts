import type { RPCSchema } from "electrobun";
import type {
  CatalogSiteDetail,
  CatalogSiteSummary,
  CatalogVariantResult,
  DownloadProgressInfo,
  FavoriteBook,
  LibraryBook,
  LibraryMigrationState,
  NoteRecord,
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
      getFavorites: {
        params: void;
        response: FavoriteBook[];
      };
      addFavorite: {
        params: { bookId: string };
        response: { success: true };
      };
      removeFavorite: {
        params: { bookId: string };
        response: { success: true };
      };
      getNotes: {
        params: { bookId?: string };
        response: NoteRecord[];
      };
      createNote: {
        params: {
          bookId?: string | null;
          sourceUrl?: string | null;
          sourceTitle?: string | null;
          selectedText?: string | null;
          body: string;
        };
        response: NoteRecord;
      };
      updateNote: {
        params: {
          id: string;
          sourceUrl?: string | null;
          sourceTitle?: string | null;
          selectedText?: string | null;
          body: string;
        };
        response: NoteRecord | null;
      };
      deleteNote: {
        params: { id: string };
        response: { success: true };
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
