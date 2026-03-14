import { useCatalog } from "../hooks/useCatalog";
import SiteCard from "../components/SiteCard";

function Browse() {
  const { data: catalog, isLoading, error } = useCatalog();

  return (
    <div className="flex-1 overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-[1400px]">
        <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-1">Browse</h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">Discover content for offline reading</p>

        {isLoading ? (
          <p className="text-sm text-[var(--color-muted)] animate-pulse">Loading catalog...</p>
        ) : error ? (
          <p className="text-sm text-red-400">Failed to load catalog. Please try again.</p>
        ) : !catalog?.sites.length ? (
          <p className="text-sm text-[var(--color-muted)]">No sites found in the catalog.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6 justify-items-center">
            {catalog.sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Browse;
