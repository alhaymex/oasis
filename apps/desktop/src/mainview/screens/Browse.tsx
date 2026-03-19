import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Download, Search } from "lucide-react";
import { useCatalogSearch, useCatalogSites } from "../hooks/useCatalog";
import SiteCard from "../components/SiteCard";
import { api } from "../lib/rpcClient";
import { useDownloadStore } from "../store";

function Browse() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const downloads = useDownloadStore((state) => state.downloads);
  const { data: sites, isLoading, error } = useCatalogSites();
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useCatalogSearch(trimmedQuery);
  const isSearching = trimmedQuery.length >= 2;
  const hasShortQuery = trimmedQuery.length === 1;

  const handleDownload = (variantId: string, url: string, filename: string) => {
    api.startDownload(variantId, url, filename);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-[1400px]">
        <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-1">Browse</h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Discover content for offline reading
        </p>

        <div className="relative max-w-xl mb-8">
          <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search variants by name"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-4 py-3 text-sm text-[var(--color-accent)] outline-none transition-colors focus:border-[var(--color-primary)]"
          />
        </div>

        {!isSearching && !hasShortQuery && isLoading ? (
          <p className="text-sm text-[var(--color-muted)] animate-pulse">Loading catalog...</p>
        ) : !isSearching && !hasShortQuery && error ? (
          <p className="text-sm text-red-400">Failed to load catalog. Please try again.</p>
        ) : hasShortQuery ? (
          <p className="text-sm text-[var(--color-muted)]">
            Enter at least 2 characters to search.
          </p>
        ) : isSearching && isSearchLoading ? (
          <p className="text-sm text-[var(--color-muted)] animate-pulse">Searching catalog...</p>
        ) : isSearching && searchError ? (
          <p className="text-sm text-red-400">Search failed. Please try again.</p>
        ) : !isSearching && !sites?.length ? (
          <p className="text-sm text-[var(--color-muted)]">No sites found in the catalog.</p>
        ) : isSearching && !searchResults?.length ? (
          <p className="text-sm text-[var(--color-muted)]">No matching variants found.</p>
        ) : (
          <>
            {!isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6 justify-items-center">
                {sites?.map((site) => (
                  <SiteCard key={site.id} site={site} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-5xl">
                {searchResults?.map((variant) => {
                  const download = downloads[variant.id];
                  const isDownloading = download?.status === "downloading";
                  const isReady = variant.isDownloaded || download?.status === "completed";

                  return (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-accent)] truncate">
                          {variant.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
                          <Link
                            to={`/browse/${variant.siteId}`}
                            className="hover:text-[var(--color-primary)] transition-colors"
                          >
                            {variant.siteName}
                          </Link>
                          <span>{variant.sizeLabel}</span>
                        </div>
                      </div>

                      {isDownloading ? (
                        <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-[120px]">
                          <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-tight">
                            Downloading {Math.round(download.progress)}%
                          </span>
                          <div className="w-full h-1 bg-[var(--color-bg)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-primary)] transition-all duration-300"
                              style={{ width: `${download.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : isReady ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-green-400 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleDownload(variant.id, variant.downloadUrl, variant.filename)
                          }
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[var(--color-primary)] text-[var(--color-bg)] hover:brightness-110 transition-all shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Browse;
