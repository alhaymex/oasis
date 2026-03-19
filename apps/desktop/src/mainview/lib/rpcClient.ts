import { electroview } from "./electroview";

export const api = {
  ping: (msg: string) => electroview.rpc?.request.ping({ msg }),
  getCatalogSites: () => electroview.rpc?.request.getCatalogSites(),
  getCatalogSite: (siteId: string) => electroview.rpc?.request.getCatalogSite({ siteId }),
  searchCatalog: (query: string, limit?: number) =>
    electroview.rpc?.request.searchCatalog({ query, limit }),
  startDownload: (id: string, url: string, filename: string) =>
    electroview.rpc?.request.startDownload({ id, url, filename }),
  getLocalLibrary: () => electroview.rpc?.request.getLocalLibrary(),
  getActiveDownloads: () => electroview.rpc?.request.getActiveDownloads(),
};
