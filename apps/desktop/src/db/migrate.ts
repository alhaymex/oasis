import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Database } from "bun:sqlite";
import { DB_FILE_NAME } from "../shared/constants";
import path from "path";

const sqlite = new Database(DB_FILE_NAME);
const db = drizzle(sqlite);

async function main() {
  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: path.join(import.meta.dir, "../../drizzle") });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

main();
