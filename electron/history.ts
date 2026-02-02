import { getDb } from "./db.js";
import { type HistoryEntry } from "../src/bridge/types.js";

const createId = (url: string) => `hist-${Buffer.from(url).toString("base64url")}`;

export const recordVisit = (url: string, title: string) => {
  const db = getDb();
  const id = createId(url);
  const now = Date.now();
  const existing = db
    .prepare("SELECT visitCount FROM history WHERE id = ?")
    .get(id) as { visitCount: number } | undefined;

  if (existing) {
    db.prepare("UPDATE history SET title = ?, visitCount = ?, lastVisitedAt = ? WHERE id = ?").run(
      title,
      existing.visitCount + 1,
      now,
      id
    );
  } else {
    db.prepare(
      "INSERT INTO history (id, url, title, visitCount, lastVisitedAt) VALUES (?, ?, ?, ?, ?)"
    ).run(id, url, title || url, 1, now);
  }
};

export const listHistory = (): HistoryEntry[] => {
  const db = getDb();
  return db
    .prepare("SELECT id, url, title, visitCount, lastVisitedAt FROM history ORDER BY lastVisitedAt DESC")
    .all() as HistoryEntry[];
};

export const clearHistory = () => {
  const db = getDb();
  db.prepare("DELETE FROM history").run();
};
