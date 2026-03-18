import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Database } from "bun:sqlite";
import { getLibraryPath, ensureDir, APP_ROOT } from "../bun/utils/paths";
import path, { join } from "path";
import { existsSync } from "fs";

export async function runMigrations(db: BunSQLiteDatabase<any>) {
  // In development, APP_ROOT is the apps/desktop directory

  let migrationsFolder = path.join(APP_ROOT, "drizzle");

  if (!existsSync(migrationsFolder)) {
    migrationsFolder = path.join(import.meta.dir, "../../drizzle");
  }

  console.log(`[db] Running migrations from: ${migrationsFolder}`);
  if (!existsSync(migrationsFolder)) {
    throw new Error(`Migrations folder not found at: ${migrationsFolder}`);
  }

  await migrate(db, { migrationsFolder });
}

async function main() {
  const dbPath = path.join(getLibraryPath(), "oasis.sqlite");
  ensureDir(getLibraryPath());
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log("Running migrations via CLI...");
  try {
    await runMigrations(db);
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

if (import.meta.main) {
  main();
}
