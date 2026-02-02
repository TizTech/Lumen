import { getDb } from "./db.js";
import { type BookmarkEntry } from "../src/bridge/types.js";

const createId = () => `bm-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const listBookmarks = (): BookmarkEntry[] => {
  const db = getDb();
  return db
    .prepare("SELECT id, url, title, folderId, createdAt FROM bookmarks ORDER BY createdAt DESC")
    .all() as BookmarkEntry[];
};

export const addBookmark = (url: string, title: string) => {
  const db = getDb();
  const id = createId();
  const createdAt = Date.now();
  db.prepare("INSERT INTO bookmarks (id, url, title, folderId, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    id,
    url,
    title || url,
    null,
    createdAt
  );
};

export const removeBookmark = (id: string) => {
  const db = getDb();
  db.prepare("DELETE FROM bookmarks WHERE id = ?").run(id);
};
