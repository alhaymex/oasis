import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { DB_FILE_NAME } from "@/shared/constants";

const sqlite = new Database(DB_FILE_NAME);
export const db = drizzle({ client: sqlite });
