import { DownloadProgressInfo } from "../../shared/types";
import { create } from "zustand";
import { api } from "../lib/rpcClient";

interface DownloadStore {
  downloads: Record<string, DownloadProgressInfo>;
  updateProgress: (progress: DownloadProgressInfo) => void;
  setAllDownloads: (downloads: DownloadProgressInfo[]) => void;
  removeDownload: (id: string) => void;
}

export const useDownloadStore = create<DownloadStore>((set) => ({
  downloads: {},
  updateProgress: (progress) =>
    set((state) => ({
      downloads: { ...state.downloads, [progress.id]: progress },
    })),
  setAllDownloads: (downloads) =>
    set(() => {
      const map: Record<string, DownloadProgressInfo> = {};
      downloads.forEach((d) => {
        map[d.id] = d;
      });
      return { downloads: map };
    }),
  removeDownload: (id) =>
    set((state) => {
      const next = { ...state.downloads };
      delete next[id];
      return { downloads: next };
    }),
}));

api.getActiveDownloads()?.then((downloads) => {
  if (downloads) {
    useDownloadStore.getState().setAllDownloads(downloads);
  }
});
