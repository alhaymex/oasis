import { existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { APP_ROOT } from "./paths";

function getPackagedCatalogPath(): string {
  return resolve(dirname(process.execPath), "..", "Resources", "app", "catalog", "catalog.json");
}

export function resolveBundledCatalogPath(): string {
  const candidates = [
    getPackagedCatalogPath(),
    join(APP_ROOT, ".generated", "catalog", "catalog.json"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Bundled catalog not found. Checked: ${candidates.map((candidate) => `"${candidate}"`).join(", ")}`
  );
}
