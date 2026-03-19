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
  getFavorites: () => electroview.rpc?.request.getFavorites(),
  addFavorite: (bookId: string) => electroview.rpc?.request.addFavorite({ bookId }),
  removeFavorite: (bookId: string) => electroview.rpc?.request.removeFavorite({ bookId }),
  getNotes: (bookId?: string) => electroview.rpc?.request.getNotes({ bookId }),
  createNote: (input: {
    bookId?: string | null;
    sourceUrl?: string | null;
    sourceTitle?: string | null;
    selectedText?: string | null;
    body: string;
  }) => electroview.rpc?.request.createNote(input),
  updateNote: (input: {
    id: string;
    sourceUrl?: string | null;
    sourceTitle?: string | null;
    selectedText?: string | null;
    body: string;
  }) => electroview.rpc?.request.updateNote(input),
  deleteNote: (id: string) => electroview.rpc?.request.deleteNote({ id }),
  getActiveDownloads: () => electroview.rpc?.request.getActiveDownloads(),
  getConfig: () => electroview.rpc?.request.getConfig(),
  switchTheme: (themeId: string) => electroview.rpc?.request.switchTheme({ themeId }),
  startLibraryMigration: (nextLibraryPath: string) =>
    electroview.rpc?.request.startLibraryMigration({ nextLibraryPath }),
  getLibraryMigrationState: () => electroview.rpc?.request.getLibraryMigrationState(),
};
