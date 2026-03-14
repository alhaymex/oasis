import type { StoreCatalog, StoreSite, StoreVariant } from "../../shared/types";

const KIWIX_OPDS_URL = "https://library.kiwix.org/catalog/v2/entries?count=200";
const CURATED_CATALOG_URL = "https://raw.githubusercontent.com/alhaymex/oasis/main/catalog/catalog.json";

const log = (msg: string, ...args: any[]) => console.log(`[catalog-fetcher] ${msg}`, ...args);

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${units[i]}`;
}

/** Capitalize first letter of each word */
function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface OPDSEntry {
  id: string;
  title: string;
  summary: string;
  language: string;
  name: string;       // e.g. "wikipedia_ce_all"
  category: string;   // e.g. "wikipedia"
  author: string;
  downloadUrl: string;
  sizeBytes: number;
}

function parseOPDSEntries(xml: string): OPDSEntry[] {
  // Simple regex-based XML parser since we're in Bun (no DOMParser)
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

    // Extract the download link (acquisition)
    const linkMatch = block.match(
      /<link[^>]*rel="http:\/\/opds-spec\.org\/acquisition\/open-access"[^>]*href="([^"]*)"[^>]*length="(\d+)"/
    );

    if (!linkMatch) continue; // skip entries without a download link

    let downloadUrl = linkMatch[1];
    const sizeBytes = parseInt(linkMatch[2], 10);

    // The URL typically ends with .meta4 — strip it to get the direct .zim link
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
    // Use category if available, otherwise derive from the name (e.g. "wikipedia_en_all" -> "wikipedia")
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
      // Build a human-readable variant name from the title + language
      const langLabel = e.language ? ` (${e.language.toUpperCase()})` : "";

      return {
        id: e.name,
        name: `${e.title}${langLabel}`,
        sizeStr: formatBytes(e.sizeBytes),
        filename,
        url: e.downloadUrl,
      };
    });

    // Sort variants by size descending
    variants.sort((a, b) => {
      const sizeA = parseFloat(a.sizeStr);
      const sizeB = parseFloat(b.sizeStr);
      return sizeB - sizeA;
    });

    // Limit variants per site to keep payload small
    if (variants.length > 10) variants.length = 10;

    sites.push({
      id: key,
      name: group.author || titleCase(key.replace(/[-_]/g, " ")),
      description: `${variants.length} version${variants.length !== 1 ? "s" : ""} available from ${group.author || key}`,
      icon: key.includes("wiki") ? "globe" : "book",
      variants,
    });
  }

  // Sort sites alphabetically
  sites.sort((a, b) => a.name.localeCompare(b.name));

  return sites;
}

/** Fetch the curated catalog from GitHub */
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

/** Fetch and parse the full Kiwix OPDS catalog */
async function fetchKiwixCatalog(): Promise<StoreSite[]> {
  try {
    log("Fetching Kiwix OPDS catalog (this may take a few seconds)...");
    const res = await fetch(KIWIX_OPDS_URL);
    if (!res.ok) {
      log(`Kiwix OPDS fetch failed: ${res.status}`);
      return [];
    }
    const xml = await res.text();
    log(`Kiwix OPDS response: ${(xml.length / 1024).toFixed(0)} KB`);
    const entries = parseOPDSEntries(xml);
    const sites = groupEntriesIntoSites(entries);
    log(`Grouped into ${sites.length} sites`);
    return sites;
  } catch (err) {
    console.error("Failed to fetch Kiwix OPDS catalog:", err);
    return [];
  }
}

/**
 * Fetches both the curated catalog and the full Kiwix OPDS catalog,
 * merges them, and returns a unified StoreCatalog.
 * Curated sites appear first and are not duplicated from the OPDS feed.
 */
export async function fetchMergedCatalog(): Promise<StoreCatalog> {
  log("Starting merged catalog fetch...");
  const [curated, kiwixSites] = await Promise.all([
    fetchCuratedCatalog(),
    fetchKiwixCatalog(),
  ]);

  const curatedSites = curated?.sites ?? [];
  const curatedIds = new Set(curatedSites.map((s) => s.id));

  // Filter out OPDS sites that are already in the curated list
  const uniqueKiwixSites = kiwixSites.filter((s) => !curatedIds.has(s.id));

  log(`Merged: ${curatedSites.length} curated + ${uniqueKiwixSites.length} kiwix = ${curatedSites.length + uniqueKiwixSites.length} total sites`);

  return {
    sites: [...curatedSites, ...uniqueKiwixSites],
  };
}
