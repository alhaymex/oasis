import type { RPCSchema } from "electrobun";
import type { StoreCatalog, DownloadProgressInfo } from "./types";

export type AppRPCSchema = {
  // functions that can be called from the client
  bun: RPCSchema<{
    requests: {
      ping: {
        params: { msg: string };
        response: void;
      };
      getStoreCatalog: {
        params: { url: string };
        response: StoreCatalog | null;
      };
      startDownload: {
        params: { id: string; url: string; filename: string };
        response: boolean;
      };
      getLocalLibrary: {
        params: void;
        response: string[];
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
