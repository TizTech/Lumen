import { type BookmarkEntry, type ContentBounds, type DownloadItem, type HistoryEntry, type SessionState, type Tab } from "./types";

type LumenApi = {
  getState: () => Promise<SessionState>;
  navigate: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  newTab: (url?: string) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  setContentBounds: (bounds: ContentBounds) => void;
  onTabsUpdated: (callback: (tabs: Tab[]) => void) => () => void;
  onActiveTabChanged: (callback: (tabId: string | null) => void) => () => void;
  history: {
    list: () => Promise<HistoryEntry[]>;
    clear: () => Promise<void>;
  };
  bookmarks: {
    list: () => Promise<BookmarkEntry[]>;
    add: (url: string, title: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
  downloads: {
    list: () => Promise<DownloadItem[]>;
    onUpdated: (callback: (items: DownloadItem[]) => void) => () => void;
  };
};

declare global {
  interface Window {
    lumen?: LumenApi;
  }
}

export {};
