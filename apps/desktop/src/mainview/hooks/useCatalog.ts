import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/rpcClient";
import type { CatalogSiteDetail, CatalogSiteSummary, CatalogVariantResult } from "@/shared/types";

export function useCatalogSites() {
  return useQuery<CatalogSiteSummary[]>({
    queryKey: ["catalog-sites"],
    queryFn: async () => (await api.getCatalogSites()) ?? [],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useSiteDetail(siteId: string | undefined) {
  return useQuery<CatalogSiteDetail | null>({
    queryKey: ["catalog-site", siteId],
    queryFn: async () => {
      if (!siteId) {
        return null;
      }

      return (await api.getCatalogSite(siteId)) ?? null;
    },
    enabled: Boolean(siteId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useCatalogSearch(query: string, limit = 50) {
  const trimmedQuery = query.trim();

  return useQuery<CatalogVariantResult[]>({
    queryKey: ["catalog-search", trimmedQuery, limit],
    queryFn: async () => {
      if (trimmedQuery.length < 2) {
        return [];
      }

      return (await api.searchCatalog(trimmedQuery, limit)) ?? [];
    },
    enabled: trimmedQuery.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
