import { db } from "./index";
import { books } from "./schema";
import { eq, sql } from "drizzle-orm";

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
  localPath?: string
) {
  return db
    .update(books)
    .set({
      isDownloaded,
      localPath,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(books.id, id))
    .run();
}

export async function getDownloadedBooks() {
  return db.select().from(books).where(eq(books.isDownloaded, true)).all();
}

export async function getBookById(id: string) {
  return db.select().from(books).where(eq(books.id, id)).get();
}

export async function deleteBookRecord(id: string) {
  return db.delete(books).where(eq(books.id, id)).run();
}
