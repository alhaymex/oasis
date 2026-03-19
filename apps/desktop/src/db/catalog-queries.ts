import { getSqliteClient } from "./index";
import type { CatalogSiteDetail, CatalogSiteSummary, CatalogVariantResult } from "../shared/types";

type VariantRow = {
  id: string;
  siteId: string;
  siteName: string;
  siteIcon: string;
  siteDescription: string;
  name: string;
  filename: string;
  downloadUrl: string;
  sizeLabel: string;
  sizeBytes: number | null;
  isDownloaded: number;
};

function mapVariantRow(row: VariantRow): CatalogVariantResult {
  return {
    id: row.id,
    siteId: row.siteId,
    siteName: row.siteName,
    siteIcon: row.siteIcon,
    siteDescription: row.siteDescription,
    name: row.name,
    filename: row.filename,
    downloadUrl: row.downloadUrl,
    sizeLabel: row.sizeLabel,
    sizeBytes: row.sizeBytes ?? null,
    isDownloaded: Boolean(row.isDownloaded),
  };
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getCatalogSites(): Promise<CatalogSiteSummary[]> {
  const sqlite = getSqliteClient();
  const rows = sqlite
    .query(
      `
        SELECT
          id,
          name,
          description,
          icon,
          variant_count AS variantCount
        FROM catalog_sites
        ORDER BY sort_index ASC, name ASC
      `
    )
    .all() as CatalogSiteSummary[];

  return rows;
}

export async function getCatalogSite(siteId: string): Promise<CatalogSiteDetail | null> {
  const sqlite = getSqliteClient();

  const site = sqlite
    .query(
      `
        SELECT
          id,
          name,
          description,
          icon,
          variant_count AS variantCount
        FROM catalog_sites
        WHERE id = ?
      `
    )
    .get(siteId) as CatalogSiteSummary | null;

  if (!site) {
    return null;
  }

  const rows = sqlite
    .query(
      `
        SELECT
          cv.id AS id,
          cv.site_id AS siteId,
          cv.site_name AS siteName,
          cv.site_icon AS siteIcon,
          cv.site_description AS siteDescription,
          cv.name AS name,
          cv.filename AS filename,
          cv.download_url AS downloadUrl,
          cv.size_label AS sizeLabel,
          cv.size_bytes AS sizeBytes,
          CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS isDownloaded
        FROM catalog_variants cv
        LEFT JOIN books b
          ON b.id = cv.filename
         AND b.is_downloaded = 1
        WHERE cv.site_id = ?
        ORDER BY cv.sort_index ASC, cv.name ASC
      `
    )
    .all(siteId) as VariantRow[];

  return {
    ...site,
    variants: rows.map(mapVariantRow),
  };
}

export async function searchCatalog(query: string, limit = 50): Promise<CatalogVariantResult[]> {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const sqlite = getSqliteClient();
  const escapedQuery = escapeLike(normalizedQuery);
  const prefixPattern = `${escapedQuery}%`;
  const containsPattern = `%${escapedQuery}%`;
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const rows = sqlite
    .query(
      `
        SELECT
          cv.id AS id,
          cv.site_id AS siteId,
          cv.site_name AS siteName,
          cv.site_icon AS siteIcon,
          cv.site_description AS siteDescription,
          cv.name AS name,
          cv.filename AS filename,
          cv.download_url AS downloadUrl,
          cv.size_label AS sizeLabel,
          cv.size_bytes AS sizeBytes,
          CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS isDownloaded
        FROM catalog_variants cv
        LEFT JOIN books b
          ON b.id = cv.filename
         AND b.is_downloaded = 1
        WHERE cv.name_normalized LIKE ? ESCAPE '\\'
        ORDER BY
          CASE
            WHEN cv.name_normalized = ? THEN 0
            WHEN cv.name_normalized LIKE ? ESCAPE '\\' THEN 1
            ELSE 2
          END,
          cv.site_name ASC,
          cv.sort_index ASC
        LIMIT ?
      `
    )
    .all(containsPattern, normalizedQuery, prefixPattern, safeLimit) as VariantRow[];

  return rows.map(mapVariantRow);
}

export async function getCatalogVariantById(
  variantId: string
): Promise<CatalogVariantResult | null> {
  const sqlite = getSqliteClient();

  const row = sqlite
    .query(
      `
        SELECT
          cv.id AS id,
          cv.site_id AS siteId,
          cv.site_name AS siteName,
          cv.site_icon AS siteIcon,
          cv.site_description AS siteDescription,
          cv.name AS name,
          cv.filename AS filename,
          cv.download_url AS downloadUrl,
          cv.size_label AS sizeLabel,
          cv.size_bytes AS sizeBytes,
          CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS isDownloaded
        FROM catalog_variants cv
        LEFT JOIN books b
          ON b.id = cv.filename
         AND b.is_downloaded = 1
        WHERE cv.id = ?
      `
    )
    .get(variantId) as VariantRow | null;

  return row ? mapVariantRow(row) : null;
}
