import type { BookmarkEntry } from "../src/bridge/types.js";
import { getBookmarks, setBookmarks } from "./storage.js";

const createId = () => `bm-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const listBookmarks = async (): Promise<BookmarkEntry[]> => {
  const bookmarks = await getBookmarks();
  return bookmarks.sort((a, b) => b.createdAt - a.createdAt);
};

export const addBookmark = async (url: string, title: string) => {
  const bookmarks = await getBookmarks();
  bookmarks.unshift({
    id: createId(),
    url,
    title: title || url,
    folderId: null,
    createdAt: Date.now(),
  });
  await setBookmarks(bookmarks);
};

export const removeBookmark = async (id: string) => {
  const bookmarks = await getBookmarks();
  await setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id));
};
