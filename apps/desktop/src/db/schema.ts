import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const books = sqliteTable("books", {
  id: text("id").primaryKey(),
  opdsId: text("opds_id"),
  name: text("name"),
  title: text("title"),
  summary: text("summary"),
  language: text("language"),
  author: text("author"),
  category: text("category"),
  sizeBytes: integer("size_bytes"),
  downloadUrl: text("download_url"),
  localPath: text("local_path"),
  isDownloaded: integer("is_downloaded", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
