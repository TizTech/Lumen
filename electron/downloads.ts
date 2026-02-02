import { session } from "electron";
import { type DownloadItem } from "../src/bridge/types.js";

type DownloadListener = (items: DownloadItem[]) => void;

const downloads = new Map<string, DownloadItem>();
const listeners = new Set<DownloadListener>();

export const setupDownloads = () => {
  session.defaultSession.on("will-download", (_event, item) => {
    const id = `dl-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const download: DownloadItem = {
      id,
      filename: item.getFilename(),
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
      receivedBytes: item.getReceivedBytes(),
      state: "progressing",
      startedAt: Date.now(),
    };

    downloads.set(id, download);
    emit();

    item.on("updated", () => {
      const current = downloads.get(id);
      if (!current) return;
      current.receivedBytes = item.getReceivedBytes();
      current.totalBytes = item.getTotalBytes();
      current.state = item.isPaused() ? "interrupted" : "progressing";
      emit();
    });

    item.once("done", (_event, state) => {
      const current = downloads.get(id);
      if (!current) return;
      current.state = state;
      emit();
    });
  });
};

export const listDownloads = () => Array.from(downloads.values());

export const onDownloadsUpdated = (listener: DownloadListener) => {
  listeners.add(listener);
  listener(listDownloads());
  return () => listeners.delete(listener);
};

const emit = () => {
  const items = listDownloads();
  listeners.forEach((listener) => listener(items));
};
