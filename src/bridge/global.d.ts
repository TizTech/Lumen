import { type BookmarkEntry, type ContentBounds, type DownloadItem, type HistoryEntry, type SessionState, type Tab } from "./types";

type LumenApi = {
  getState: () => Promise<SessionState>;
  navigate: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  newTab: (url?: string, activate?: boolean) => Promise<string | null>;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  setContentBounds: (bounds: ContentBounds) => void;
  hideView: () => void;
  showView: () => void;
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
  onNewTabRequested: (callback: () => void) => () => void;
};

declare global {
  interface Window {
    lumen?: LumenApi;
    lumenEnv?: {
      isElectron: boolean;
    };
  }
}

export {};
