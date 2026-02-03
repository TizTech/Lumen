import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
const storagePath = () => path.join(app.getPath("userData"), "storage.json");
let cache = null;
let writeTimer = null;
const defaultState = {
    bookmarks: [],
    history: [],
};
const loadStorage = async () => {
    if (cache)
        return cache;
    try {
        const raw = await fs.readFile(storagePath(), "utf-8");
        cache = JSON.parse(raw);
    }
    catch {
        cache = defaultState;
    }
    return cache;
};
const scheduleWrite = () => {
    if (writeTimer)
        clearTimeout(writeTimer);
    writeTimer = setTimeout(async () => {
        if (!cache)
            return;
        try {
            await fs.writeFile(storagePath(), JSON.stringify(cache, null, 2));
        }
        catch {
            // ignore write errors for now
        }
    }, 200);
};
export const getHistory = async () => {
    const state = await loadStorage();
    return state.history;
};
export const setHistory = async (history) => {
    const state = await loadStorage();
    state.history = history;
    scheduleWrite();
};
export const getBookmarks = async () => {
    const state = await loadStorage();
    return state.bookmarks;
};
export const setBookmarks = async (bookmarks) => {
    const state = await loadStorage();
    state.bookmarks = bookmarks;
    scheduleWrite();
};
