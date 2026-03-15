import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/rpcClient";

export function useLibrary() {
  return useQuery({
    queryKey: ["local-library"],
    queryFn: async () => {
      const res = await api.getLocalLibrary();
      return res;
    },
  });
}
