import { app, BrowserWindow, ipcMain, crashReporter, globalShortcut } from "electron";
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
  const preloadPath = app.isPackaged
    ? path.join(__dirname, "preload.cjs")
    : path.join(process.cwd(), "electron", "preload.cjs");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    backgroundColor: "#f6f7f9",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
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
    const indexPath = path.join(app.getAppPath(), "dist", "index.html");
    await mainWindow.loadFile(indexPath);
  } else {
    await mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Failed to load", { errorCode, errorDescription, validatedURL });
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

  const registerShortcuts = () => {
    globalShortcut.register("CommandOrControl+T", () => {
      if (mainWindow?.isFocused()) {
        mainWindow.webContents.send("ui:newtab");
      }
    });
    // Cmd/Ctrl+W: close tab if more than 1, otherwise close window.
    globalShortcut.register("CommandOrControl+W", () => {
      if (!mainWindow?.isFocused()) return;
      const count = tabManager?.getTabCount() ?? 0;
      if (count <= 1) {
        mainWindow.close();
        return;
      }
      const activeId = tabManager?.getActiveTabId();
      if (activeId) {
        tabManager?.closeTab(activeId);
      }
    });
  };

  const unregisterShortcuts = () => {
    globalShortcut.unregisterAll();
  };

  app.on("browser-window-focus", registerShortcuts);
  app.on("browser-window-blur", unregisterShortcuts);
  registerShortcuts();
  app.on("will-quit", unregisterShortcuts);
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

ipcMain.handle("tabs:new", (_event, url?: string, activate = true) => {
  return tabManager?.createTab(url ?? "", undefined, "New Tab", activate) ?? null;
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

ipcMain.on("view:hide", () => {
  tabManager?.hideActiveView();
});

ipcMain.on("view:show", () => {
  tabManager?.showActiveView();
});

ipcMain.handle("history:list", () => listHistory());
ipcMain.handle("history:clear", async () => {
  await clearHistory();
});

ipcMain.handle("bookmarks:list", () => listBookmarks());
ipcMain.handle("bookmarks:add", async (_event, url: string, title: string) => {
  await addBookmark(url, title);
});
ipcMain.handle("bookmarks:remove", async (_event, id: string) => {
  await removeBookmark(id);
});

ipcMain.handle("downloads:list", () => listDownloads());

const installDownloadsListeners = () => {
  if (!mainWindow) return;
  onDownloadsUpdated((items) => {
    mainWindow?.webContents.send("downloads:updated", items);
  });
};

installDownloadsListeners();
