import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/rpcClient";
import type { StoreCatalog, StoreSite } from "@/shared/types";
import { ArrowLeft, Download } from "lucide-react";

export default function SiteDetail() {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<StoreSite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await api.getStoreCatalog();
      const found = data?.sites.find((s) => s.id === siteId) ?? null;
      setSite(found);
      setLoading(false);
    }
    load();
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-sm text-[var(--color-muted)] animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex-1 p-8">
        <Link to="/browse" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]">
          ← Back
        </Link>
        <p className="mt-4 text-[var(--color-accent)]">Site not found.</p>
      </div>
    );
  }

  const handleDownload = (variantId: string, url: string, filename: string) => {
    api.startDownload(variantId, url, filename);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto">
      <Link
        to="/browse"
        className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to catalog
      </Link>

      <h1 className="text-3xl font-bold text-[var(--color-accent)] mb-2">{site.name}</h1>
      <p className="text-sm text-[var(--color-muted)] mb-8 max-w-lg">{site.description}</p>

      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] mb-4">
        Available Versions
      </h2>

      <div className="flex flex-col gap-3">
        {site.variants.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between gap-4 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-accent)] truncate">{v.name}</p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">{v.sizeStr}</p>
            </div>
            <button
              onClick={() => handleDownload(v.id, v.url, v.filename)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[var(--color-primary)] text-[var(--color-bg)] hover:brightness-110 transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
