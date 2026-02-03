import updater from "electron-updater";
const { autoUpdater } = updater;
export const setupUpdater = () => {
    if (!process.env.LUMEN_UPDATES) {
        return;
    }
    autoUpdater.autoDownload = false;
    autoUpdater.logger = null;
    try {
        autoUpdater.checkForUpdates();
    }
    catch {
        // ignore update errors in dev
    }
};
