import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { dirname } from "path";
import { ensureDir, getDatabasePath } from "../bun/utils/paths";

let internalDb: BunSQLiteDatabase<Record<string, never>> | null = null;
let internalSqlite: Database | null = null;

export const db = new Proxy({} as BunSQLiteDatabase<Record<string, never>>, {
  get(_target, prop) {
    if (!internalDb) {
      throw new Error("[db] Database accessed before initialization.");
    }
    return (internalDb as any)[prop];
  },
});

export function initDb(dbPath: string) {
  closeDb();

  ensureDir(dirname(dbPath));
  const sqlite = new Database(dbPath);
  internalSqlite = sqlite;
  internalDb = drizzle(sqlite);
  console.log(`[db] Database initialized at: ${dbPath}`);
}

export function closeDb() {
  if (internalSqlite) {
    internalSqlite.close();
    internalSqlite = null;
  }
  internalDb = null;
}

export function getSqliteClient(): Database {
  if (!internalSqlite) {
    initDb(getDatabasePath());
  }

  return internalSqlite as Database;
}
