import Database from "better-sqlite3";
import path from "node:path";
import { app } from "electron";

const dbPath = () => path.join(app.getPath("userData"), "lumen.db");

let db: Database.Database | null = null;

export const getDb = () => {
  if (!db) {
    db = new Database(dbPath());
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        visitCount INTEGER NOT NULL,
        lastVisitedAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        folderId TEXT,
        createdAt INTEGER NOT NULL
      );
    `);
  }
  return db;
};
