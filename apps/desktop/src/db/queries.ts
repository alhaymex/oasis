import { db } from "./index";
import { books, favorites, notes } from "./schema";
import { desc, eq, sql } from "drizzle-orm";
import { stat } from "fs/promises";

export type NewBook = typeof books.$inferInsert;
export type Book = typeof books.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Note = typeof notes.$inferSelect;

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

export function getFavoriteBooks() {
  const rows = db
    .select({
      id: books.id,
      opdsId: books.opdsId,
      name: books.name,
      title: books.title,
      summary: books.summary,
      language: books.language,
      author: books.author,
      category: books.category,
      sizeBytes: books.sizeBytes,
      downloadUrl: books.downloadUrl,
      localPath: books.localPath,
      isDownloaded: books.isDownloaded,
      updatedAt: books.updatedAt,
      favoritedAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(books, eq(favorites.bookId, books.id))
    .orderBy(desc(favorites.createdAt))
    .all();

  return Promise.all(
    rows.map(async (book) => {
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

export async function addFavorite(bookId: string) {
  return db.insert(favorites).values({ bookId }).onConflictDoNothing().run();
}

export async function removeFavorite(bookId: string) {
  return db.delete(favorites).where(eq(favorites.bookId, bookId)).run();
}

export function getNotes(bookId?: string) {
  if (!bookId) {
    return Promise.resolve(
      db.select().from(notes).orderBy(desc(notes.updatedAt), desc(notes.createdAt)).all()
    );
  }

  return Promise.resolve(
    db
      .select()
      .from(notes)
      .where(eq(notes.bookId, bookId))
      .orderBy(desc(notes.updatedAt), desc(notes.createdAt))
      .all()
  );
}

export async function createNote(input: NewNote) {
  db.insert(notes).values(input).run();
  return db.select().from(notes).where(eq(notes.id, input.id)).get() ?? null;
}

export async function updateNote(
  id: string,
  updates: Pick<NewNote, "sourceUrl" | "sourceTitle" | "selectedText" | "body">
) {
  db.update(notes)
    .set({
      ...updates,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(notes.id, id))
    .run();

  return db.select().from(notes).where(eq(notes.id, id)).get() ?? null;
}

export async function deleteNote(id: string) {
  return db.delete(notes).where(eq(notes.id, id)).run();
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
