import { contextBridge, ipcRenderer } from "electron";
import type {
  BookmarkEntry,
  ContentBounds,
  DownloadItem,
  HistoryEntry,
  SessionState,
  Tab,
} from "../src/bridge/types.js";

contextBridge.exposeInMainWorld("lumen", {
  getState: () => ipcRenderer.invoke("tabs:get") as Promise<SessionState>,
  navigate: (url: string) => ipcRenderer.send("tabs:navigate", url),
  goBack: () => ipcRenderer.send("tabs:back"),
  goForward: () => ipcRenderer.send("tabs:forward"),
  reload: () => ipcRenderer.send("tabs:reload"),
  newTab: (url?: string, activate = true) => ipcRenderer.invoke("tabs:new", url, activate) as Promise<string | null>,
  closeTab: (id: string) => ipcRenderer.send("tabs:close", id),
  activateTab: (id: string) => ipcRenderer.send("tabs:activate", id),
  setContentBounds: (bounds: ContentBounds) => ipcRenderer.send("view:bounds", bounds),
  hideView: () => ipcRenderer.send("view:hide"),
  showView: () => ipcRenderer.send("view:show"),
  onTabsUpdated: (callback: (tabs: Tab[]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, tabs: Tab[]) => callback(tabs);
    ipcRenderer.on("tabs:updated", listener);
    return () => ipcRenderer.removeListener("tabs:updated", listener);
  },
  onActiveTabChanged: (callback: (tabId: string | null) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, tabId: string | null) => callback(tabId);
    ipcRenderer.on("tab:active", listener);
    return () => ipcRenderer.removeListener("tab:active", listener);
  },
  history: {
    list: () => ipcRenderer.invoke("history:list") as Promise<HistoryEntry[]>,
    clear: () => ipcRenderer.invoke("history:clear") as Promise<void>,
  },
  bookmarks: {
    list: () => ipcRenderer.invoke("bookmarks:list") as Promise<BookmarkEntry[]>,
    add: (url: string, title: string) => ipcRenderer.invoke("bookmarks:add", url, title) as Promise<void>,
    remove: (id: string) => ipcRenderer.invoke("bookmarks:remove", id) as Promise<void>,
  },
  downloads: {
    list: () => ipcRenderer.invoke("downloads:list") as Promise<DownloadItem[]>,
    onUpdated: (callback: (items: DownloadItem[]) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, items: DownloadItem[]) => callback(items);
      ipcRenderer.on("downloads:updated", listener);
      return () => ipcRenderer.removeListener("downloads:updated", listener);
    },
  },
  onNewTabRequested: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("ui:newtab", listener);
    return () => ipcRenderer.removeListener("ui:newtab", listener);
  },
});

contextBridge.exposeInMainWorld("lumenEnv", {
  isElectron: true,
});
