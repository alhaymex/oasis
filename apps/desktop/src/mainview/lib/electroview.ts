import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "@/shared/rpc";
import type { DownloadProgressInfo } from "@/shared/types";
import { useDownloadStore, useLibraryMigrationStore } from "../store";
import { queryClient } from "./queryClient";

type ProgressListener = (progress: DownloadProgressInfo) => void;
const progressListeners = new Set<ProgressListener>();

export const rpcEvents = {
  subscribeToProgress: (cb: ProgressListener) => {
    progressListeners.add(cb);
    return () => {
      progressListeners.delete(cb);
    };
  },
};

const rpc = Electroview.defineRPC<AppRPCSchema>({
  handlers: {
    requests: {},
    messages: {
      onDownloadProgress: (progress) => {
        useDownloadStore.getState().updateProgress(progress);
        progressListeners.forEach((listener) => listener(progress));

        if (progress.status === "completed") {
          queryClient.invalidateQueries({ queryKey: ["local-library"] });
          queryClient.invalidateQueries({ queryKey: ["catalog-site"] });
          queryClient.invalidateQueries({ queryKey: ["catalog-search"] });
        }

        if (progress.status === "completed") {
          setTimeout(() => {
            useDownloadStore.getState().removeDownload(progress.id);
          }, 3000);
        }
      },
      onLibraryMigrationProgress: (state) => {
        useLibraryMigrationStore.getState().setState(state, Date.now());
      },
    },
  },
});

export const electroview = new Electroview({ rpc });
