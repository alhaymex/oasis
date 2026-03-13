import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "@/shared/rpc";
import type { DownloadProgressInfo } from "@/shared/types";

type ProgressListener = (progress: DownloadProgressInfo) => void;
const progressListeners = new Set<ProgressListener>();

export const rpcEvents = {
  subscribeToProgress: (cb: ProgressListener) => {
    progressListeners.add(cb);
    return () => { progressListeners.delete(cb); };
  }
};

const rpc = Electroview.defineRPC<AppRPCSchema>({
  handlers: {
    requests: {},
    messages: {
      onDownloadProgress: (progress) => {
        progressListeners.forEach(cb => cb(progress));
      }
    },
  },
});

export const electroview = new Electroview({ rpc });
