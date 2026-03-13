import { BrowserView } from "electrobun";
import { AppRPCSchema } from "../shared/rpc";
import { ConfigManager } from "./utils/config-manager";
import { ZimManager } from "./utils/zim-manager";
import { ZimDownloader } from "./utils/download-manager";

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
      getStoreCatalog: async ({ url }) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          return await res.json();
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
