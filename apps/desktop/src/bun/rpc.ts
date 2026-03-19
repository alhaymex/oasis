import { BrowserView } from "electrobun";
import { AppRPCSchema } from "../shared/rpc";
import { getDownloadedBooks } from "../db/queries";
import { fetchMergedCatalog } from "./utils/catalog-fetcher";
import { runtime } from "./runtime";

export const rpc = BrowserView.defineRPC<AppRPCSchema>({
  maxRequestTime: 60_000,
  handlers: {
    requests: {
      ping: ({ msg }) => console.log(msg),
      getStoreCatalog: async () => {
        try {
          const catalog = await fetchMergedCatalog();
          const jsonSize = JSON.stringify(catalog).length;
          console.log(
            `[rpc] getStoreCatalog returning ${catalog.sites.length} sites (${(jsonSize / 1024).toFixed(0)} KB)`
          );
          return catalog;
        } catch (err) {
          console.error("Failed to fetch catalog:", err);
          return null;
        }
      },
      startDownload: ({ id, url, filename }) => runtime.startDownload(id, url, filename),
      getLocalLibrary: () => getDownloadedBooks(),
      getActiveDownloads: () => runtime.getActiveDownloads(),
      getConfig: () => runtime.getConfigManager().getConfig(),
      switchTheme: async ({ themeId }) => {
        await runtime.getConfigManager().switchTheme(themeId);
        return runtime.getConfigManager().getConfig();
      },
      startLibraryMigration: ({ nextLibraryPath }) =>
        runtime.getMigrationManager().startLibraryMigration(nextLibraryPath),
      getLibraryMigrationState: () => runtime.getMigrationManager().getState(),
    },
  },
});
