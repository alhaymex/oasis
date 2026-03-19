import { mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";

const desktopRoot = join(import.meta.dirname, "..");
const sourceCatalogPath = join(desktopRoot, "..", "..", "catalog", "catalog.json");
const stagedCatalogPath = join(desktopRoot, ".generated", "catalog", "catalog.json");

if (!existsSync(sourceCatalogPath)) {
  throw new Error(`Catalog source not found at ${sourceCatalogPath}`);
}

mkdirSync(dirname(stagedCatalogPath), { recursive: true });
copyFileSync(sourceCatalogPath, stagedCatalogPath);

console.log(`[stage-catalog] Staged catalog to ${stagedCatalogPath}`);
