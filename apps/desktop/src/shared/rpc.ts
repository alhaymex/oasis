import type { RPCSchema } from "electrobun";
import type {
  StoreCatalog,
  DownloadProgressInfo,
  LibraryBook,
  LibraryMigrationState,
} from "./types";
import type { AppConfig } from "../schema/config";

export type AppRPCSchema = {
  // functions that can be called from the client
  bun: RPCSchema<{
    requests: {
      ping: {
        params: { msg: string };
        response: void;
      };
      getStoreCatalog: {
        params: void;
        response: StoreCatalog | null;
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

  // functions that can be called from the bun process
  webview: RPCSchema<{
    requests: {};
    messages: {
      onDownloadProgress: DownloadProgressInfo;
      onLibraryMigrationProgress: LibraryMigrationState;
    };
  }>;
};
