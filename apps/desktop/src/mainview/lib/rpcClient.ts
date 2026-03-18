import { electroview } from "./electroview";

export const api = {
  ping: (msg: string) => electroview.rpc?.request.ping({ msg }),
  getStoreCatalog: () => electroview.rpc?.request.getStoreCatalog(),
  startDownload: (id: string, url: string, filename: string) =>
    electroview.rpc?.request.startDownload({ id, url, filename }),
  getLocalLibrary: () => electroview.rpc?.request.getLocalLibrary(),
  getActiveDownloads: () => electroview.rpc?.request.getActiveDownloads(),
};
