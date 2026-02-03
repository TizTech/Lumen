import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import type { BookmarkEntry, HistoryEntry } from "../src/bridge/types.js";

type StorageShape = {
  bookmarks: BookmarkEntry[];
  history: HistoryEntry[];
};

const storagePath = () => path.join(app.getPath("userData"), "storage.json");

let cache: StorageShape | null = null;
let writeTimer: NodeJS.Timeout | null = null;

const defaultState: StorageShape = {
  bookmarks: [],
  history: [],
};

const loadStorage = async () => {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(storagePath(), "utf-8");
    cache = JSON.parse(raw) as StorageShape;
  } catch {
    cache = defaultState;
  }
  return cache;
};

const scheduleWrite = () => {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(async () => {
    if (!cache) return;
    try {
      await fs.writeFile(storagePath(), JSON.stringify(cache, null, 2));
    } catch {
      // ignore write errors for now
    }
  }, 200);
};

export const getHistory = async () => {
  const state = await loadStorage();
  return state.history;
};

export const setHistory = async (history: HistoryEntry[]) => {
  const state = await loadStorage();
  state.history = history;
  scheduleWrite();
};

export const getBookmarks = async () => {
  const state = await loadStorage();
  return state.bookmarks;
};

export const setBookmarks = async (bookmarks: BookmarkEntry[]) => {
  const state = await loadStorage();
  state.bookmarks = bookmarks;
  scheduleWrite();
};
