import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
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

export const catalogSites = sqliteTable("catalog_sites", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  variantCount: integer("variant_count").notNull(),
  sortIndex: integer("sort_index").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const catalogVariants = sqliteTable(
  "catalog_variants",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").notNull(),
    siteName: text("site_name").notNull(),
    siteIcon: text("site_icon").notNull(),
    siteDescription: text("site_description").notNull(),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    filename: text("filename").notNull(),
    downloadUrl: text("download_url").notNull(),
    sizeLabel: text("size_label").notNull(),
    sizeBytes: integer("size_bytes"),
    sortIndex: integer("sort_index").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  },
  (table) => ({
    siteIdIdx: index("catalog_variants_site_id_idx").on(table.siteId),
    nameNormalizedIdx: index("catalog_variants_name_normalized_idx").on(table.nameNormalized),
    filenameIdx: uniqueIndex("catalog_variants_filename_idx").on(table.filename),
  })
);

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
