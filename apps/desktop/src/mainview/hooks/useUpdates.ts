import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppConfig } from "@/schema/config";
import type { AppUpdateState } from "@/shared/types";
import { api } from "../lib/rpcClient";

export function useUpdateState() {
  return useQuery<AppUpdateState>({
    queryKey: ["update-state"],
    queryFn: async () => {
      const response = await api.getUpdateState();
      if (!response) {
        throw new Error("Update state unavailable");
      }
      return response;
    },
    refetchInterval: 4000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateActions() {
  const queryClient = useQueryClient();

  const refreshUpdateState = async () => {
    await queryClient.invalidateQueries({ queryKey: ["update-state"] });
  };

  const setAutoUpdate = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await api.setAutoUpdate(enabled);
      if (!response) {
        throw new Error("Failed to update auto-update setting.");
      }
      return response;
    },
    onSuccess: async (nextConfig) => {
      queryClient.setQueryData<AppConfig>(["app-config"], nextConfig);
      await refreshUpdateState();
    },
  });

  const checkForUpdates = useMutation({
    mutationFn: async (autoDownload: boolean) => {
      const response = await api.checkForUpdates(autoDownload);
      if (!response) {
        throw new Error("Failed to check for updates.");
      }
      return response;
    },
    onSuccess: async (state) => {
      queryClient.setQueryData(["update-state"], state);
      await refreshUpdateState();
    },
  });

  const applyUpdate = useMutation({
    mutationFn: async () => {
      const response = await api.applyUpdate();
      if (!response) {
        throw new Error("Failed to apply update.");
      }
      return response;
    },
  });

  return {
    setAutoUpdate,
    checkForUpdates,
    applyUpdate,
  };
}
