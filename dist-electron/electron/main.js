import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import TabManager from "./tabManager.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
const SESSION_FILE = () => path.join(app.getPath("userData"), "session.json");
let mainWindow = null;
let tabManager = null;
let persistTimeout = null;
const defaultSession = {
    tabs: [{ id: "tab-initial", title: "New Tab", url: "", favicon: undefined, isLoading: false, isActive: true }],
    activeTabId: "tab-initial",
};
const readSession = async () => {
    try {
        const raw = await fs.readFile(SESSION_FILE(), "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return defaultSession;
    }
};
const schedulePersist = () => {
    if (!tabManager)
        return;
    if (persistTimeout) {
        clearTimeout(persistTimeout);
    }
    persistTimeout = setTimeout(async () => {
        try {
            const state = tabManager?.getState();
            if (state) {
                await fs.writeFile(SESSION_FILE(), JSON.stringify(state, null, 2));
            }
        }
        catch {
            // ignore persistence errors
        }
    }, 300);
};
const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        backgroundColor: "#f6f7f9",
        titleBarStyle: "hiddenInset",
        trafficLightPosition: { x: 20, y: 20 },
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    tabManager = new TabManager({
        window: mainWindow,
        onTabsUpdated: (tabs) => {
            mainWindow?.webContents.send("tabs:updated", tabs);
            schedulePersist();
        },
        onActiveTabChanged: (tabId) => {
            mainWindow?.webContents.send("tab:active", tabId);
        },
    });
    const session = await readSession();
    tabManager.restoreSession(session);
    if (app.isPackaged) {
        await mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
    }
    else {
        await mainWindow.loadURL(DEV_SERVER_URL);
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
};
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
ipcMain.handle("tabs:get", () => {
    return tabManager?.getState() ?? defaultSession;
});
ipcMain.on("tabs:new", (_event, url) => {
    tabManager?.createTab(url ?? "");
});
ipcMain.on("tabs:close", (_event, id) => {
    tabManager?.closeTab(id);
});
ipcMain.on("tabs:activate", (_event, id) => {
    tabManager?.activateTab(id);
});
ipcMain.on("tabs:navigate", (_event, url) => {
    tabManager?.navigate(url);
});
ipcMain.on("tabs:back", () => {
    tabManager?.goBack();
});
ipcMain.on("tabs:forward", () => {
    tabManager?.goForward();
});
ipcMain.on("tabs:reload", () => {
    tabManager?.reload();
});
ipcMain.on("view:bounds", (_event, bounds) => {
    tabManager?.setContentBounds(bounds);
});
