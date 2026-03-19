import { BrowserView } from "electrobun";
import { AppRPCSchema } from "../shared/rpc";
import {
  getCatalogSite,
  getCatalogSites,
  getCatalogVariantById,
  searchCatalog,
} from "../db/catalog-queries";
import {
  addFavorite,
  createNote,
  deleteNote,
  getFavoriteBooks,
  getNotes,
  removeFavorite,
  getDownloadedBooks,
  upsertBooks,
  updateNote,
} from "../db/queries";
import { runtime } from "./runtime";

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

        return runtime.startDownload(id, downloadUrl, downloadFilename);
      },
      getLocalLibrary: () => getDownloadedBooks(),
      getFavorites: () => getFavoriteBooks(),
      addFavorite: async ({ bookId }) => {
        await addFavorite(bookId);
        return { success: true as const };
      },
      removeFavorite: async ({ bookId }) => {
        await removeFavorite(bookId);
        return { success: true as const };
      },
      getNotes: ({ bookId }) => getNotes(bookId),
      createNote: async ({ bookId, sourceUrl, sourceTitle, selectedText, body }) => {
        const note = await createNote({
          id: crypto.randomUUID(),
          bookId: bookId ?? null,
          sourceUrl: sourceUrl ?? null,
          sourceTitle: sourceTitle ?? null,
          selectedText: selectedText ?? null,
          body,
        });

        if (!note) {
          throw new Error("Failed to create note.");
        }

        return note;
      },
      updateNote: ({ id, sourceUrl, sourceTitle, selectedText, body }) =>
        updateNote(id, {
          sourceUrl: sourceUrl ?? null,
          sourceTitle: sourceTitle ?? null,
          selectedText: selectedText ?? null,
          body,
        }),
      deleteNote: async ({ id }) => {
        await deleteNote(id);
        return { success: true as const };
      },
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
