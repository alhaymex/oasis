import { useQuery } from "@tanstack/react-query";
import type { AppConfig } from "@/schema/config";
import { api } from "../lib/rpcClient";

export function useAppConfig() {
  return useQuery<AppConfig>({
    queryKey: ["app-config"],
    queryFn: async () => {
      const res = await api.getConfig();
      if (!res) {
        throw new Error("Config not available");
      }
      return res;
    },
    staleTime: Infinity,
  });
}
