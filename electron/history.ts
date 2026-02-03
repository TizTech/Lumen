import type { HistoryEntry } from "../src/bridge/types.js";
import { getHistory, setHistory } from "./storage.js";

const createId = (url: string) => `hist-${Buffer.from(url).toString("base64url")}`;

export const recordVisit = async (url: string, title: string) => {
  const history = await getHistory();
  const id = createId(url);
  const now = Date.now();
  const existing = history.find((entry) => entry.id === id);

  if (existing) {
    existing.title = title || url;
    existing.visitCount += 1;
    existing.lastVisitedAt = now;
  } else {
    history.unshift({
      id,
      url,
      title: title || url,
      visitCount: 1,
      lastVisitedAt: now,
    });
  }

  await setHistory(history);
};

export const listHistory = async (): Promise<HistoryEntry[]> => {
  const history = await getHistory();
  return history.sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);
};

export const clearHistory = async () => {
  await setHistory([]);
};
