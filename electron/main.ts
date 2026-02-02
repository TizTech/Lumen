import { app, BrowserWindow, ipcMain, crashReporter } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import TabManager from "./tabManager.js";
import type { ContentBounds, SessionState } from "../src/bridge/types.js";
import { listHistory, clearHistory } from "./history.js";
import { listBookmarks, addBookmark, removeBookmark } from "./bookmarks.js";
import { listDownloads, onDownloadsUpdated, setupDownloads } from "./downloads.js";
import { setupUpdater } from "./updater.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
const SESSION_FILE = () => path.join(app.getPath("userData"), "session.json");

let mainWindow: BrowserWindow | null = null;
let tabManager: TabManager | null = null;
let persistTimeout: NodeJS.Timeout | null = null;

const defaultSession: SessionState = {
  tabs: [{ id: "tab-initial", title: "New Tab", url: "", favicon: undefined, isLoading: false, isActive: true }],
  activeTabId: "tab-initial",
};

const normalizeUrl = (raw: string) => {
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:", "file:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const readSession = async (): Promise<SessionState> => {
  try {
    const raw = await fs.readFile(SESSION_FILE(), "utf-8");
    return JSON.parse(raw) as SessionState;
  } catch {
    return defaultSession;
  }
};

const schedulePersist = () => {
  if (!tabManager) return;
  if (persistTimeout) {
    clearTimeout(persistTimeout);
  }
  persistTimeout = setTimeout(async () => {
    try {
      const state = tabManager?.getState();
      if (state) {
        await fs.writeFile(SESSION_FILE(), JSON.stringify(state, null, 2));
      }
    } catch {
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
      sandbox: true,
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
  setupDownloads();

  if (app.isPackaged) {
    await mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  } else {
    await mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.whenReady().then(createWindow);

app.whenReady().then(() => {
  if (process.env.LUMEN_CRASH_REPORTING === "1") {
    crashReporter.start({
      submitURL: "https://example.com/crash", // replace with real endpoint later
      uploadToServer: true,
    });
  }
  setupUpdater();
});

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

ipcMain.on("tabs:new", (_event, url?: string) => {
  tabManager?.createTab(url ?? "");
});

ipcMain.on("tabs:close", (_event, id: string) => {
  tabManager?.closeTab(id);
});

ipcMain.on("tabs:activate", (_event, id: string) => {
  tabManager?.activateTab(id);
});

ipcMain.on("tabs:navigate", (_event, url: string) => {
  const safe = normalizeUrl(url);
  if (safe) {
    tabManager?.navigate(safe);
  }
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

ipcMain.on("view:bounds", (_event, bounds: ContentBounds) => {
  tabManager?.setContentBounds(bounds);
});

ipcMain.handle("history:list", () => listHistory());
ipcMain.handle("history:clear", () => {
  clearHistory();
});

ipcMain.handle("bookmarks:list", () => listBookmarks());
ipcMain.handle("bookmarks:add", (_event, url: string, title: string) => {
  addBookmark(url, title);
});
ipcMain.handle("bookmarks:remove", (_event, id: string) => {
  removeBookmark(id);
});

ipcMain.handle("downloads:list", () => listDownloads());

const installDownloadsListeners = () => {
  if (!mainWindow) return;
  onDownloadsUpdated((items) => {
    mainWindow?.webContents.send("downloads:updated", items);
  });
};

installDownloadsListeners();
