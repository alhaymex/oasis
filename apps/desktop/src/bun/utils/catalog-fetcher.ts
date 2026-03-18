import type { StoreCatalog, StoreSite, StoreVariant } from "../../shared/types";
import { upsertBooks, type NewBook } from "../../db/queries";

const KIWIX_OPDS_URL = "https://library.kiwix.org/catalog/v2/entries?count=200";
const CURATED_CATALOG_URL = "https://raw.githubusercontent.com/alhaymex/oasis/main/catalog/catalog.json";

const log = (msg: string, ...args: any[]) => console.log(`[catalog-fetcher] ${msg}`, ...args);

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${units[i]}`;
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface OPDSEntry {
  id: string;
  title: string;
  summary: string;
  language: string;
  name: string;       
  category: string;   
  author: string;
  downloadUrl: string;
  sizeBytes: number;
}

function parseOPDSEntries(xml: string): OPDSEntry[] {
  const entries: OPDSEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];

    const get = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].trim() : "";
    };

    const getAuthorName = (): string => {
      const m = block.match(/<author>\s*<name>([\s\S]*?)<\/name>/);
      return m ? m[1].trim() : "";
    };

    const linkMatch = block.match(
      /<link[^>]*rel="http:\/\/opds-spec\.org\/acquisition\/open-access"[^>]*href="([^"]*)"[^>]*length="(\d+)"/
    );

    if (!linkMatch) continue;

    let downloadUrl = linkMatch[1];
    const sizeBytes = parseInt(linkMatch[2], 10);

    if (downloadUrl.endsWith(".meta4")) {
      downloadUrl = downloadUrl.slice(0, -6);
    }

    entries.push({
      id: get("id"),
      title: get("title"),
      summary: get("summary"),
      language: get("language"),
      name: get("name"),
      category: get("category"),
      author: getAuthorName(),
      downloadUrl,
      sizeBytes,
    });
  }

  log(`Parsed ${entries.length} OPDS entries`);
  return entries;
}

function groupEntriesIntoSites(entries: OPDSEntry[]): StoreSite[] {
  const siteMap = new Map<string, { entries: OPDSEntry[]; author: string; firstTitle: string }>();

  for (const entry of entries) {
    const groupKey = entry.category || entry.name.split("_")[0] || "other";

    if (!siteMap.has(groupKey)) {
      siteMap.set(groupKey, {
        entries: [],
        author: entry.author,
        firstTitle: entry.title,
      });
    }
    siteMap.get(groupKey)!.entries.push(entry);
  }

  const sites: StoreSite[] = [];

  for (const [key, group] of siteMap) {
    const variants: StoreVariant[] = group.entries.map((e) => {
      const filename = e.downloadUrl.split("/").pop() || `${e.name}.zim`;
      const langLabel = e.language ? ` (${e.language.toUpperCase()})` : "";

      return {
        id: e.name,
        name: `${e.title}${langLabel}`,
        sizeStr: formatBytes(e.sizeBytes),
        filename,
        url: e.downloadUrl,
      };
    });

    variants.sort((a, b) => {
      const sizeA = parseFloat(a.sizeStr);
      const sizeB = parseFloat(b.sizeStr);
      return sizeB - sizeA;
    });

    if (variants.length > 10) variants.length = 10;

    sites.push({
      id: key,
      name: group.author || titleCase(key.replace(/[-_]/g, " ")),
      description: `${variants.length} version${variants.length !== 1 ? "s" : ""} available from ${group.author || key}`,
      icon: key.includes("wiki") ? "globe" : "book",
      variants,
    });
  }

  sites.sort((a, b) => a.name.localeCompare(b.name));

  return sites;
}

async function fetchCuratedCatalog(): Promise<StoreCatalog | null> {
  try {
    log("Fetching curated catalog from GitHub...");
    const res = await fetch(CURATED_CATALOG_URL);
    if (!res.ok) {
      log(`Curated catalog fetch failed: ${res.status}`);
      return null;
    }
    const data = await res.json();
    log(`Curated catalog loaded: ${data.sites?.length ?? 0} sites`);
    return data;
  } catch (err) {
    log("Curated catalog error:", err);
    return null;
  }
}

async function fetchKiwixCatalog(): Promise<{ sites: StoreSite[]; entries: OPDSEntry[] }> {
  try {
    log("Fetching Kiwix OPDS catalog (this may take a few seconds)...");
    const res = await fetch(KIWIX_OPDS_URL);
    if (!res.ok) {
      log(`Kiwix OPDS fetch failed: ${res.status}`);
      return { sites: [], entries: [] };
    }
    const xml = await res.text();
    log(`Kiwix OPDS response: ${(xml.length / 1024).toFixed(0)} KB`);
    const entries = parseOPDSEntries(xml);
    const sites = groupEntriesIntoSites(entries);
    log(`Grouped into ${sites.length} sites`);
    return { sites, entries };
  } catch (err) {
    console.error("Failed to fetch Kiwix OPDS catalog:", err);
    return { sites: [], entries: [] };
  }
}

/**
 * Fetches both the curated catalog and the full Kiwix OPDS catalog,
 * merges them, and returns a unified StoreCatalog.
 * Curated sites appear first and are not duplicated from the OPDS feed.
 */
export async function fetchMergedCatalog(): Promise<StoreCatalog> {
  log("Starting merged catalog fetch...");
  const [curated, kiwixResult] = await Promise.all([
    fetchCuratedCatalog(),
    fetchKiwixCatalog(),
  ]);

  const curatedSites = curated?.sites ?? [];
  const kiwixSites = kiwixResult.sites;
  const kiwixEntries = kiwixResult.entries;

  const curatedIds = new Set(curatedSites.map((s) => s.id));

  const uniqueKiwixSites = kiwixSites.filter((s) => !curatedIds.has(s.id));

  log(`Merged: ${curatedSites.length} curated + ${uniqueKiwixSites.length} kiwix = ${curatedSites.length + uniqueKiwixSites.length} total sites`);

  const dbBooks: NewBook[] = [];

  for (const entry of kiwixEntries) {
    const filename = entry.downloadUrl.split("/").pop() || `${entry.name}.zim`;
    dbBooks.push({
      id: filename,
      opdsId: entry.id,
      name: entry.name,
      title: entry.title,
      summary: entry.summary,
      language: entry.language,
      author: entry.author,
      category: entry.category,
      sizeBytes: entry.sizeBytes,
      downloadUrl: entry.downloadUrl,
    });
  }

  for (const site of curatedSites) {
    for (const variant of site.variants) {
      dbBooks.push({
        id: variant.filename,
        name: variant.id,
        title: variant.name,
        summary: site.description,
        downloadUrl: variant.url,
        category: site.id,
      });
    }
  }

  try {
    // NOTE: we store the entire catalog in the local db
    // this seems like the best option for now
    await upsertBooks(dbBooks);
    log(`Stored metadata for ${dbBooks.length} variants in DB`);
  } catch (err) {
    log("Failed to store metadata in DB:", err);
  }

  return {
    sites: [...curatedSites, ...uniqueKiwixSites],
  };
}
