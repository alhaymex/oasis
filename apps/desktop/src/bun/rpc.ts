import { BrowserView } from "electrobun";
import { AppRPCSchema } from "../shared/rpc";
import { ConfigManager } from "./utils/config-manager";
import { ZimManager } from "./utils/zim-manager";
import { ZimDownloader } from "./utils/download-manager";
import {
  getCatalogSite,
  getCatalogSites,
  getCatalogVariantById,
  searchCatalog,
} from "../db/catalog-queries";
import { getDownloadedBooks, upsertBooks } from "../db/queries";

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
    throw err;
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
      getCatalogSites: () => getCatalogSites(),
      getCatalogSite: ({ siteId }) => getCatalogSite(siteId),
      searchCatalog: ({ query, limit }) => searchCatalog(query, limit),
      startDownload: async ({ id, url, filename }) => {
        const variant = await getCatalogVariantById(id);
        const downloadUrl = variant?.downloadUrl ?? url;
        const downloadFilename = variant?.filename ?? filename;

        if (variant) {
          await upsertBooks([
            {
              id: variant.filename,
              name: variant.id,
              title: variant.name,
              summary: variant.siteDescription,
              category: variant.siteId,
              sizeBytes: variant.sizeBytes,
              downloadUrl: variant.downloadUrl,
            },
          ]);
        }

        zimDownloader.startDownload(id, downloadUrl, downloadFilename).catch(console.error);
        return true;
      },
      getLocalLibrary: () => getDownloadedBooks(),
      getActiveDownloads: () => zimDownloader.getActiveDownloads(),
    },
  },
});

export { configManager };
export const getZimManager = () => zimManager;
export const getZimDownloader = () => zimDownloader;

export { zimManager, zimDownloader };
