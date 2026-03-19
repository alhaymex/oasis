import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "@/shared/rpc";
import type { DownloadProgressInfo } from "@/shared/types";
import { useDownloadStore } from "../store";
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
    },
  },
});

export const electroview = new Electroview({ rpc });
