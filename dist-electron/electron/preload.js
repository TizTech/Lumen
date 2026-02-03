import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("lumen", {
    getState: () => ipcRenderer.invoke("tabs:get"),
    navigate: (url) => ipcRenderer.send("tabs:navigate", url),
    goBack: () => ipcRenderer.send("tabs:back"),
    goForward: () => ipcRenderer.send("tabs:forward"),
    reload: () => ipcRenderer.send("tabs:reload"),
    newTab: (url, activate = true) => ipcRenderer.invoke("tabs:new", url, activate),
    closeTab: (id) => ipcRenderer.send("tabs:close", id),
    activateTab: (id) => ipcRenderer.send("tabs:activate", id),
    setContentBounds: (bounds) => ipcRenderer.send("view:bounds", bounds),
    hideView: () => ipcRenderer.send("view:hide"),
    showView: () => ipcRenderer.send("view:show"),
    onTabsUpdated: (callback) => {
        const listener = (_event, tabs) => callback(tabs);
        ipcRenderer.on("tabs:updated", listener);
        return () => ipcRenderer.removeListener("tabs:updated", listener);
    },
    onActiveTabChanged: (callback) => {
        const listener = (_event, tabId) => callback(tabId);
        ipcRenderer.on("tab:active", listener);
        return () => ipcRenderer.removeListener("tab:active", listener);
    },
    history: {
        list: () => ipcRenderer.invoke("history:list"),
        clear: () => ipcRenderer.invoke("history:clear"),
    },
    bookmarks: {
        list: () => ipcRenderer.invoke("bookmarks:list"),
        add: (url, title) => ipcRenderer.invoke("bookmarks:add", url, title),
        remove: (id) => ipcRenderer.invoke("bookmarks:remove", id),
    },
    downloads: {
        list: () => ipcRenderer.invoke("downloads:list"),
        onUpdated: (callback) => {
            const listener = (_event, items) => callback(items);
            ipcRenderer.on("downloads:updated", listener);
            return () => ipcRenderer.removeListener("downloads:updated", listener);
        },
    },
    extensions: {
        list: () => ipcRenderer.invoke("extensions:list"),
        loadUnpacked: () => ipcRenderer.invoke("extensions:load-unpacked"),
        installFromWebStore: (id) => ipcRenderer.invoke("extensions:install", id),
        remove: (id) => ipcRenderer.invoke("extensions:remove", id),
    },
    onNewTabRequested: (callback) => {
        const listener = () => callback();
        ipcRenderer.on("ui:newtab", listener);
        return () => ipcRenderer.removeListener("ui:newtab", listener);
    },
});
contextBridge.exposeInMainWorld("lumenEnv", {
    isElectron: true,
});
