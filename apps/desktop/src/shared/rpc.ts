import type { RPCSchema } from "electrobun";
import type {
  CatalogSiteDetail,
  CatalogSiteSummary,
  CatalogVariantResult,
  DownloadProgressInfo,
  LibraryBook,
} from "./types";

export type AppRPCSchema = {
  // functions that can be called from the client
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
    };
    messages: {};
  }>;

  // functions that can be called from the bun process
  webview: RPCSchema<{
    requests: {};
    messages: {
      onDownloadProgress: DownloadProgressInfo;
    };
  }>;
};
