import { useEffect, useMemo, useState } from "react";
import { type BookmarkEntry, type SessionState, type Tab } from "../bridge/types";

const fallbackTabs: Tab[] = [
  { id: "tab-1", title: "Lumen Brief", favicon: "✦", url: "", isLoading: false, isActive: true },
  { id: "tab-2", title: "Design Notes", favicon: "✎", url: "", isLoading: false, isActive: false },
  { id: "tab-3", title: "Field Research", favicon: "◎", url: "", isLoading: false, isActive: false },
];

const fallbackState: SessionState = {
  tabs: fallbackTabs,
  activeTabId: "tab-1",
};

const useTabs = () => {
  const [state, setState] = useState<SessionState>(fallbackState);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);

  const refreshBookmarks = () => {
    if (!window.lumen) return;
    window.lumen.bookmarks.list().then(setBookmarks);
  };

  useEffect(() => {
    if (!window.lumen) {
      return;
    }

    let unsubscribeTabs = () => {};
    let unsubscribeActive = () => {};

    window.lumen.getState().then((initialState) => {
      setState(initialState);
    });

    window.lumen.bookmarks.list().then(setBookmarks);

    unsubscribeTabs = window.lumen.onTabsUpdated((tabs) => {
      setState((prev) => ({ ...prev, tabs }));
    });

    unsubscribeActive = window.lumen.onActiveTabChanged((activeTabId) => {
      setState((prev) => ({ ...prev, activeTabId }));
    });

    return () => {
      unsubscribeTabs();
      unsubscribeActive();
    };
  }, []);

  const activeTab = useMemo(
    () => state.tabs.find((tab) => tab.id === state.activeTabId) ?? null,
    [state.tabs, state.activeTabId]
  );

  return {
    tabs: state.tabs,
    activeTab,
    bookmarks,
    refreshBookmarks,
    commands: window.lumen ?? null,
  };
};

export default useTabs;
