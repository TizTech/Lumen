import { autoUpdater } from "electron-updater";

export const setupUpdater = () => {
  if (!process.env.LUMEN_UPDATES) {
    return;
  }
  autoUpdater.autoDownload = false;
  autoUpdater.logger = null;

  try {
    autoUpdater.checkForUpdates();
  } catch {
    // ignore update errors in dev
  }
};
