import { db } from "./index";
import { books } from "./schema";
import { eq, sql } from "drizzle-orm";
import { stat } from "fs/promises";

export type NewBook = typeof books.$inferInsert;
export type Book = typeof books.$inferSelect;

export async function upsertBooks(newBooks: NewBook[]) {
  if (newBooks.length === 0) return;

  return db
    .insert(books)
    .values(newBooks)
    .onConflictDoUpdate({
      target: books.id,
      set: {
        opdsId: sql`excluded.opds_id`,
        name: sql`excluded.name`,
        title: sql`excluded.title`,
        summary: sql`excluded.summary`,
        language: sql`excluded.language`,
        author: sql`excluded.author`,
        category: sql`excluded.category`,
        sizeBytes: sql`excluded.size_bytes`,
        downloadUrl: sql`excluded.download_url`,
        updatedAt: sql`(unixepoch())`,
      },
    })
    .run();
}

export async function updateBookDownloadStatus(
  id: string,
  isDownloaded: boolean,
  localPath?: string,
  sizeBytes?: number
) {
  return db
    .update(books)
    .set({
      isDownloaded,
      localPath,
      sizeBytes,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(books.id, id))
    .run();
}

export async function getDownloadedBooks() {
  const downloadedBooks = db.select().from(books).where(eq(books.isDownloaded, true)).all();

  return Promise.all(
    downloadedBooks.map(async (book) => {
      if ((book.sizeBytes ?? 0) > 0 || !book.localPath) {
        return book;
      }

      try {
        const fileStats = await stat(book.localPath);
        return {
          ...book,
          sizeBytes: fileStats.size,
        };
      } catch {
        return book;
      }
    })
  );
}

export async function getBookById(id: string) {
  return db.select().from(books).where(eq(books.id, id)).get();
}

export async function deleteBookRecord(id: string) {
  return db.delete(books).where(eq(books.id, id)).run();
}

export function bulkRewriteLocalPaths(oldLibraryPath: string, newLibraryPath: string) {
  const likePattern = `${oldLibraryPath}%`;

  return db.transaction((tx) => {
    tx.run(sql`
      UPDATE books
      SET local_path = REPLACE(local_path, ${oldLibraryPath}, ${newLibraryPath})
      WHERE local_path IS NOT NULL
        AND local_path LIKE ${likePattern}
    `);
  });
}
