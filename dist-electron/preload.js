import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("lumen", {
    getState: () => ipcRenderer.invoke("tabs:get"),
    navigate: (url) => ipcRenderer.send("tabs:navigate", url),
    goBack: () => ipcRenderer.send("tabs:back"),
    goForward: () => ipcRenderer.send("tabs:forward"),
    reload: () => ipcRenderer.send("tabs:reload"),
    newTab: (url) => ipcRenderer.send("tabs:new", url),
    closeTab: (id) => ipcRenderer.send("tabs:close", id),
    activateTab: (id) => ipcRenderer.send("tabs:activate", id),
    setContentBounds: (bounds) => ipcRenderer.send("view:bounds", bounds),
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
});
