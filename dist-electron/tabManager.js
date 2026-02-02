import { BrowserView } from "electron";
const createId = () => `tab-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
export default class TabManager {
    window;
    tabs = new Map();
    activeTabId = null;
    bounds = { x: 0, y: 0, width: 800, height: 600 };
    onTabsUpdated;
    onActiveTabChanged;
    constructor({ window, onTabsUpdated, onActiveTabChanged }) {
        this.window = window;
        this.onTabsUpdated = onTabsUpdated;
        this.onActiveTabChanged = onActiveTabChanged;
    }
    getState() {
        return {
            tabs: this.getTabSnapshots(),
            activeTabId: this.activeTabId,
        };
    }
    restoreSession(session) {
        session.tabs.forEach((tab) => {
            this.createTab(tab.url, tab.id, tab.title);
        });
        if (session.activeTabId) {
            this.activateTab(session.activeTabId);
        }
        else if (this.tabs.size > 0) {
            this.activateTab(this.tabs.keys().next().value);
        }
    }
    createTab(url = "", id = createId(), title = "New Tab") {
        const tab = {
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
    closeTab(id) {
        const tab = this.tabs.get(id);
        if (!tab)
            return;
        if (this.activeTabId === id) {
            this.detachView();
        }
        tab.view?.webContents.destroy();
        this.tabs.delete(id);
        if (this.tabs.size === 0) {
            this.createTab();
        }
        else if (this.activeTabId === id) {
            const nextId = this.tabs.keys().next().value;
            this.activateTab(nextId);
        }
        this.emitTabsUpdated();
    }
    activateTab(id) {
        if (!this.tabs.has(id))
            return;
        this.activeTabId = id;
        this.attachViewForActiveTab();
        this.emitTabsUpdated();
        this.onActiveTabChanged(this.activeTabId);
    }
    navigate(url) {
        if (!this.activeTabId) {
            this.createTab(url);
            return;
        }
        const tab = this.tabs.get(this.activeTabId);
        if (!tab)
            return;
        if (!tab.view) {
            tab.view = this.createView(tab);
            this.attachView(tab.view);
        }
        tab.view.webContents.loadURL(url);
    }
    goBack() {
        const view = this.getActiveView();
        if (view?.webContents.canGoBack())
            view.webContents.goBack();
    }
    goForward() {
        const view = this.getActiveView();
        if (view?.webContents.canGoForward())
            view.webContents.goForward();
    }
    reload() {
        const view = this.getActiveView();
        view?.webContents.reload();
    }
    setContentBounds(bounds) {
        this.bounds = bounds;
        const view = this.getActiveView();
        if (view) {
            view.setBounds(bounds);
        }
    }
    getActiveView() {
        if (!this.activeTabId)
            return null;
        const tab = this.tabs.get(this.activeTabId);
        return tab?.view ?? null;
    }
    attachViewForActiveTab() {
        const tab = this.activeTabId ? this.tabs.get(this.activeTabId) : null;
        if (!tab || !tab.view) {
            this.detachView();
            return;
        }
        this.attachView(tab.view);
    }
    attachView(view) {
        this.window.setBrowserView(view);
        view.setBounds(this.bounds);
    }
    detachView() {
        this.window.setBrowserView(null);
    }
    emitTabsUpdated() {
        this.onTabsUpdated(this.getTabSnapshots());
    }
    createView(tab) {
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
            this.emitTabsUpdated();
        });
        view.webContents.on("did-navigate-in-page", (_event, url) => {
            tab.url = url;
            this.emitTabsUpdated();
        });
        return view;
    }
    getTabSnapshots() {
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
