import { BrowserView } from "electrobun";
import { AppRPCSchema } from "../shared/rpc";
import { ConfigManager } from "./utils/config-manager";
import { ZimManager } from "./utils/zim-manager";
import { ZimDownloader } from "./utils/download-manager";
import { fetchMergedCatalog } from "./utils/catalog-fetcher";
import { getDownloadedBooks } from "../db/queries";

const configManager = new ConfigManager();
let zimManager: ZimManager;
let zimDownloader: ZimDownloader;

export async function initServices() {
  await configManager.init();
  const config = configManager.getConfig();

  const { initDb, db } = await import("../db/index");
  const { runMigrations } = await import("../db/migrate");
  const { join } = await import("path");
  initDb(join(config.libraryPath, "oasis.sqlite"));

  // Auto-migrate on startup
  try {
    await runMigrations(db);
  } catch (err) {
    console.error("[db] Auto-migration failed:", err);
  }

  zimManager = new ZimManager(config.libraryPath);
  zimDownloader = new ZimDownloader(zimManager);

  zimDownloader.setProgressCallback((progress) => {
    rpc.send("onDownloadProgress", progress);
  });
}

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
      startDownload: ({ id, url, filename }) => {
        zimDownloader.startDownload(id, url, filename).catch(console.error);
        return true;
      },
      getLocalLibrary: () => getDownloadedBooks(),
      getActiveDownloads: () => zimDownloader.getActiveDownloads(),
      getConfig: () => configManager.getConfig(),
      switchTheme: async ({ themeId }) => {
        await configManager.switchTheme(themeId);
        return configManager.getConfig();
      },
    },
  },
});

export { configManager };
export const getZimManager = () => zimManager;
export const getZimDownloader = () => zimDownloader;

export { zimManager, zimDownloader };
