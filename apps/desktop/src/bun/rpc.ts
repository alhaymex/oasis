import { BrowserView } from "electrobun";
import { AppRPCSchema } from "../shared/rpc";
import { ConfigManager } from "./utils/config-manager";
import { ZimManager } from "./utils/zim-manager";
import { ZimDownloader } from "./utils/download-manager";
import { fetchMergedCatalog } from "./utils/catalog-fetcher";

const configManager = new ConfigManager();
configManager.init().catch(console.error);

const config = configManager.getConfig();
const zimManager = new ZimManager(config.libraryPath);
const zimDownloader = new ZimDownloader(zimManager);

export const rpc = BrowserView.defineRPC<AppRPCSchema>({
  maxRequestTime: 60_000,
  handlers: {
    requests: {
      ping: ({ msg }) => console.log(msg),
      getStoreCatalog: async () => {
        try {
          const catalog = await fetchMergedCatalog();
          const jsonSize = JSON.stringify(catalog).length;
          console.log(`[rpc] getStoreCatalog returning ${catalog.sites.length} sites (${(jsonSize / 1024).toFixed(0)} KB)`);
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
      getLocalLibrary: () => zimManager.getZimFiles(),
      getActiveDownloads: () => zimDownloader.getActiveDownloads(),
    },
  },
});

export { configManager, zimManager, zimDownloader };
