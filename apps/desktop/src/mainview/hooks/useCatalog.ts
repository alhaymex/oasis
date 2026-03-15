import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/rpcClient";
import type { StoreCatalog, StoreSite } from "@/shared/types";

export function useCatalog() {
  return useQuery<StoreCatalog>({
    queryKey: ["store-catalog"],
    queryFn: async () => {
      const res = await api.getStoreCatalog();
      if (!res || !res.sites) {
        throw new Error("Catalog not available");
      }
      return res;
    },
    staleTime: 5 * 60 * 1000, 
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useSiteDetail(siteId: string | undefined) {
  const { data: catalog, ...rest } = useCatalog();

  const site: StoreSite | undefined = catalog?.sites.find((s) => s.id === siteId);

  return {
    site,
    ...rest,
  };
}
