import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { join, dirname } from "path";
import { getLibraryPath, ensureDir } from "../bun/utils/paths";

let internalDb: BunSQLiteDatabase<Record<string, never>> | null = null;

export const db = new Proxy({} as BunSQLiteDatabase<Record<string, never>>, {
  get(_target, prop) {
    if (!internalDb) {
      // Fallback/Default initialization
      initDb(join(getLibraryPath(), "oasis.sqlite"));
    }
    return (internalDb as any)[prop];
  },
});

export function initDb(dbPath: string) {
  if (internalDb) {
    // If we already have a connection, we might want to close it?
    // For now, let's just allow re-initialization if needed, though usually it's once.
  }

  ensureDir(dirname(dbPath));
  const sqlite = new Database(dbPath);
  internalDb = drizzle(sqlite);
  console.log(`[db] Database initialized at: ${dbPath}`);
}
