import { readFile } from "fs/promises";
import { createHash } from "crypto";
import { getSqliteClient } from "../../db";
import { resolveBundledCatalogPath } from "./catalog-path";

type BundledCatalog = {
  sites: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    variants: Array<{
      id: string;
      name: string;
      size?: number | null;
      sizeStr?: string;
      filename: string;
      url: string;
    }>;
  }>;
};

function normalizeCatalogText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseBundledCatalog(raw: string): BundledCatalog {
  const parsed = JSON.parse(raw) as BundledCatalog;

  if (!parsed || !Array.isArray(parsed.sites)) {
    throw new Error("Bundled catalog JSON is invalid: missing sites array.");
  }

  return parsed;
}

function computeCatalogHash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function upsertMeta(key: string, value: string) {
  const sqlite = getSqliteClient();
  sqlite
    .query(
      `
        INSERT INTO app_meta (key, value, updated_at)
        VALUES (?, ?, unixepoch())
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = unixepoch()
      `
    )
    .run(key, value);
}

export async function ensureBundledCatalogSeeded(): Promise<void> {
  const sqlite = getSqliteClient();
  const catalogPath = resolveBundledCatalogPath();
  const rawCatalog = await readFile(catalogPath, "utf-8");
  const catalogHash = computeCatalogHash(rawCatalog);
  const currentHashRow = sqlite
    .query(`SELECT value FROM app_meta WHERE key = 'catalog_hash'`)
    .get() as { value?: string } | null;

  if (currentHashRow?.value === catalogHash) {
    console.log("[catalog-seed] Catalog hash unchanged, skipping reseed.");
    return;
  }

  const catalog = parseBundledCatalog(rawCatalog);
  const now = Math.floor(Date.now() / 1000).toString();

  const upsertSite = sqlite.query(
    `
      INSERT INTO catalog_sites (
        id,
        name,
        description,
        icon,
        variant_count,
        sort_index,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, unixepoch())
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        icon = excluded.icon,
        variant_count = excluded.variant_count,
        sort_index = excluded.sort_index,
        updated_at = unixepoch()
    `
  );

  const upsertVariant = sqlite.query(
    `
      INSERT INTO catalog_variants (
        id,
        site_id,
        site_name,
        site_icon,
        site_description,
        name,
        name_normalized,
        filename,
        download_url,
        size_label,
        size_bytes,
        sort_index,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
      ON CONFLICT(id) DO UPDATE SET
        site_id = excluded.site_id,
        site_name = excluded.site_name,
        site_icon = excluded.site_icon,
        site_description = excluded.site_description,
        name = excluded.name,
        name_normalized = excluded.name_normalized,
        filename = excluded.filename,
        download_url = excluded.download_url,
        size_label = excluded.size_label,
        size_bytes = excluded.size_bytes,
        sort_index = excluded.sort_index,
        updated_at = unixepoch()
    `
  );

  const transaction = sqlite.transaction(() => {
    const siteIds: string[] = [];
    const variantIds: string[] = [];

    catalog.sites.forEach((site, siteIndex) => {
      if (!site.id || !Array.isArray(site.variants)) {
        throw new Error(`Bundled catalog site is invalid: ${JSON.stringify(site)}`);
      }

      siteIds.push(site.id);
      upsertSite.run(
        site.id,
        site.name,
        site.description,
        site.icon,
        site.variants.length,
        siteIndex
      );

      site.variants.forEach((variant, variantIndex) => {
        if (!variant.id || !variant.filename || !variant.url) {
          throw new Error(
            `Bundled catalog variant is invalid for site "${site.id}": ${JSON.stringify(variant)}`
          );
        }

        variantIds.push(variant.id);
        upsertVariant.run(
          variant.id,
          site.id,
          site.name,
          site.icon,
          site.description,
          variant.name,
          normalizeCatalogText(variant.name),
          variant.filename,
          variant.url,
          variant.sizeStr ?? "",
          variant.size ?? null,
          variantIndex
        );
      });
    });

    if (variantIds.length > 0) {
      sqlite
        .query(
          `DELETE FROM catalog_variants WHERE id NOT IN (${variantIds.map(() => "?").join(", ")})`
        )
        .run(...variantIds);
    } else {
      sqlite.query(`DELETE FROM catalog_variants`).run();
    }

    if (siteIds.length > 0) {
      sqlite
        .query(`DELETE FROM catalog_sites WHERE id NOT IN (${siteIds.map(() => "?").join(", ")})`)
        .run(...siteIds);
    } else {
      sqlite.query(`DELETE FROM catalog_sites`).run();
    }

    upsertMeta("catalog_hash", catalogHash);
    upsertMeta("catalog_seeded_at", now);
  });

  transaction();

  const variantCount = catalog.sites.reduce((total, site) => total + site.variants.length, 0);
  console.log(
    `[catalog-seed] Seeded ${catalog.sites.length} sites and ${variantCount} variants from ${catalogPath}`
  );
}
