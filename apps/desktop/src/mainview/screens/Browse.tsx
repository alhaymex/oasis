import { useEffect, useState } from "react";
import { api } from "../lib/rpcClient";
import type { StoreCatalog } from "@/shared/types";
import SiteCard from "../components/SiteCard";

function Browse() {
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      console.log("[Browse] Requesting catalog...");
      try {
        const data = await api.getStoreCatalog();
        console.log("[Browse] Got response:", data ? `${data.sites?.length} sites` : "null");
        setCatalog(data ?? null);
      } catch (err) {
        console.error("[Browse] RPC error:", err);
      }
      setLoading(false);
    }
    loadCatalog();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-1">Browse</h1>
      <p className="text-sm text-[var(--color-muted)] mb-8">Discover content for offline reading</p>

      {loading ? (
        <p className="text-sm text-[var(--color-muted)] animate-pulse">Loading catalog...</p>
      ) : !catalog || catalog.sites.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No sites found in the catalog.</p>
      ) : (
        <div className="flex flex-wrap gap-6">
          {catalog.sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Browse;
