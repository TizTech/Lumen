import { BrowserView, BrowserWindow } from "electron";
import type { ContentBounds, SessionState, Tab } from "../src/bridge/types.js";
import { recordVisit } from "./history.js";

export type TabState = {
  id: string;
  view?: BrowserView;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
};

type TabManagerOptions = {
  window: BrowserWindow;
  onTabsUpdated: (tabs: Tab[]) => void;
  onActiveTabChanged: (tabId: string | null) => void;
};

const createId = () => `tab-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export default class TabManager {
  private window: BrowserWindow;
  private tabs = new Map<string, TabState>();
  private activeTabId: string | null = null;
  private bounds: ContentBounds = { x: 0, y: 0, width: 800, height: 600 };
  private onTabsUpdated: TabManagerOptions["onTabsUpdated"];
  private onActiveTabChanged: TabManagerOptions["onActiveTabChanged"];

  constructor({ window, onTabsUpdated, onActiveTabChanged }: TabManagerOptions) {
    this.window = window;
    this.onTabsUpdated = onTabsUpdated;
    this.onActiveTabChanged = onActiveTabChanged;
  }

  getState(): SessionState {
    return {
      tabs: this.getTabSnapshots(),
      activeTabId: this.activeTabId,
    };
  }

  restoreSession(session: SessionState) {
    session.tabs.forEach((tab) => {
      this.createTab(tab.url, tab.id, tab.title);
    });
    if (session.activeTabId) {
      this.activateTab(session.activeTabId);
    } else if (this.tabs.size > 0) {
      const first = this.tabs.keys().next().value;
      if (first) {
        this.activateTab(first);
      }
    }
  }

  createTab(url = "", id = createId(), title = "New Tab") {
    const tab: TabState = {
      id,
      title,
      url,
      isLoading: false,
      favicon: undefined,
    };

    if (url) {
      tab.view = this.createView(tab);
      tab.view.webContents.loadURL(url);
    }

    this.tabs.set(id, tab);
    this.emitTabsUpdated();
    if (!this.activeTabId) {
      this.activateTab(id);
    }
  }

  closeTab(id: string) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    if (this.activeTabId === id) {
      this.detachView();
    }

    tab.view?.webContents.close();
    this.tabs.delete(id);

    if (this.tabs.size === 0) {
      this.createTab();
    } else if (this.activeTabId === id) {
      const nextId = this.tabs.keys().next().value;
      if (nextId) {
        this.activateTab(nextId);
      }
    }

    this.emitTabsUpdated();
  }

  activateTab(id: string) {
    if (!this.tabs.has(id)) return;
    this.activeTabId = id;
    this.attachViewForActiveTab();
    this.emitTabsUpdated();
    this.onActiveTabChanged(this.activeTabId);
  }

  navigate(url: string) {
    if (!this.activeTabId) {
      this.createTab(url);
      return;
    }
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return;
    if (!tab.view) {
      tab.view = this.createView(tab);
      this.attachView(tab.view);
    }
    tab.url = url;
    tab.view.webContents.loadURL(url);
    }

  goBack() {
    const view = this.getActiveView();
    if (view?.webContents.canGoBack()) view.webContents.goBack();
  }

  goForward() {
    const view = this.getActiveView();
    if (view?.webContents.canGoForward()) view.webContents.goForward();
  }

  reload() {
    const view = this.getActiveView();
    view?.webContents.reload();
  }

  setContentBounds(bounds: ContentBounds) {
    this.bounds = bounds;
    const view = this.getActiveView();
    if (view) {
      view.setBounds(bounds);
    }
  }

  private getActiveView() {
    if (!this.activeTabId) return null;
    const tab = this.tabs.get(this.activeTabId);
    return tab?.view ?? null;
  }

  private attachViewForActiveTab() {
    const tab = this.activeTabId ? this.tabs.get(this.activeTabId) : null;
    if (!tab || !tab.view) {
      this.detachView();
      return;
    }
    this.attachView(tab.view);
  }

  private attachView(view: BrowserView) {
    this.window.setBrowserView(view);
    view.setBounds(this.bounds);
  }

  private detachView() {
    this.window.setBrowserView(null);
  }

  private emitTabsUpdated() {
    this.onTabsUpdated(this.getTabSnapshots());
  }

  private createView(tab: TabState) {
    const view = new BrowserView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    view.webContents.on("page-title-updated", (_event, title) => {
      tab.title = title;
      this.emitTabsUpdated();
    });

    view.webContents.on("did-start-loading", () => {
      tab.isLoading = true;
      this.emitTabsUpdated();
    });

    view.webContents.on("did-stop-loading", () => {
      tab.isLoading = false;
      tab.url = view.webContents.getURL();
      this.emitTabsUpdated();
    });

    view.webContents.on("page-favicon-updated", (_event, favicons) => {
      tab.favicon = favicons?.[0];
      this.emitTabsUpdated();
    });

    view.webContents.on("did-navigate", (_event, url) => {
      tab.url = url;
      recordVisit(url, tab.title || url);
      this.emitTabsUpdated();
    });

    view.webContents.on("did-navigate-in-page", (_event, url) => {
      tab.url = url;
      recordVisit(url, tab.title || url);
      this.emitTabsUpdated();
    });

    return view;
  }

  private getTabSnapshots(): Tab[] {
    return Array.from(this.tabs.values()).map((tab) => ({
      id: tab.id,
      title: tab.title || "New Tab",
      url: tab.url,
      favicon: tab.favicon,
      isLoading: tab.isLoading,
      isActive: tab.id === this.activeTabId,
    }));
  }
}
