import { useEffect, useRef, useState } from "react";
import WindowFrame from "./components/WindowFrame";
import Omnibox from "./components/Omnibox";
import Sidebar from "./components/Sidebar";
import BrowserSurface from "./components/BrowserSurface";
import NewTabModal from "./components/NewTabModal";
import useTabs from "./hooks/useTabs";
import { type Favorite, type QuickLink, type Space, type TabGroup } from "./bridge/types";
import { groupTabs } from "./utils/tabGrouping";

const spaces: Space[] = [
  { id: "space-1", name: "Personal", color: "#6f92d7", count: 5 },
  { id: "space-2", name: "Studio", color: "#5b8f8a", count: 8 },
  { id: "space-3", name: "Research", color: "#c89b7b", count: 3 },
];

const favoriteSeed: Favorite[] = [
  { id: "fav-1", name: "Aether", icon: "🌿", url: "aether.design" },
  { id: "fav-2", name: "Field Notes", icon: "📓", url: "field.io" },
  { id: "fav-3", name: "Quiet Type", icon: "🧭", url: "quiettype.co" },
];

const quickLinks: QuickLink[] = [
  { id: "quick-1", name: "Weekly Review", icon: "🌤️" },
  { id: "quick-2", name: "Studio Playlist", icon: "🎧" },
  { id: "quick-3", name: "Read Later", icon: "📖" },
  { id: "quick-4", name: "New Capture", icon: "✨" },
];

const App = () => {
  const { tabs, activeTab, commands, bookmarks, refreshBookmarks } = useTabs();
  const [isElectron, setIsElectron] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const stored = window.localStorage.getItem("lumen-theme");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const detected =
      typeof window !== "undefined" &&
      (!!window.lumenEnv?.isElectron || navigator.userAgent.toLowerCase().includes("electron"));
    setIsElectron(detected);
    if (detected) {
      document.body.classList.add("is-electron");
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("lumen-theme", theme);
    } catch {
      // Ignore storage errors in hardened contexts.
    }
  }, [theme]);
  const [bookmarksVisible, setBookmarksVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyItems, setHistoryItems] = useState<import("./bridge/types").HistoryEntry[]>([]);
  const [downloadsVisible, setDownloadsVisible] = useState(false);
  const [downloads, setDownloads] = useState<import("./bridge/types").DownloadItem[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [spacesState, setSpacesState] = useState(spaces);
  const [tabSpaceMap, setTabSpaceMap] = useState<Record<string, string>>({});
  const [tabMenu, setTabMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [activeSpaceId, setActiveSpaceId] = useState<string>("all");
  const [newTabOpen, setNewTabOpen] = useState(false);
  const [pendingSpaceId, setPendingSpaceId] = useState<string | null>(null);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const tidySnapshotRef = useRef<{ groups: TabGroup[] } | null>(null);

  const handleNavigate = (input: string) => {
    if (!commands) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const hasScheme = /^[a-zA-Z][a-zA-Z\\d+.-]*:/.test(trimmed);
    const looksLikeSearch = trimmed.includes(" ") || (!trimmed.includes(".") && !hasScheme);

    let url = trimmed;
    if (looksLikeSearch) {
      url = `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
    } else if (!hasScheme) {
      url = `https://${trimmed}`;
    }

    commands.navigate(url);
  };

  const activeUrl = activeTab?.url ?? "";
  const isBookmarked =
    !!activeUrl && bookmarks.some((bookmark) => bookmark.url.toLowerCase() === activeUrl.toLowerCase());

  useEffect(() => {
    if (!commands) return;
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey && event.key.toLowerCase() === "y") {
        setHistoryVisible((prev) => !prev);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b" && event.shiftKey) {
        setBookmarksVisible((prev) => !prev);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        setDownloadsVisible((prev) => !prev);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b" && !event.shiftKey) {
        setSidebarCollapsed((prev) => !prev);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
        event.preventDefault();
        setNewTabOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commands]);

  useEffect(() => {
    if (!commands || !historyVisible) return;
    commands.history.list().then(setHistoryItems);
  }, [commands, historyVisible, tabs]);

  useEffect(() => {
    if (!commands) return;
    commands.downloads.list().then(setDownloads);
    const unsubscribe = commands.downloads.onUpdated((items) => setDownloads(items));
    return () => unsubscribe();
  }, [commands]);

  useEffect(() => {
    if (!commands) return;
    const unsubscribe = commands.onNewTabRequested(() => setNewTabOpen(true));
    return () => unsubscribe();
  }, [commands]);


  useEffect(() => {
    if (!pendingSpaceId || !activeTab) return;
    if (!tabSpaceMap[activeTab.id]) {
      setTabSpaceMap((prev) => ({ ...prev, [activeTab.id]: pendingSpaceId }));
    }
    setPendingSpaceId(null);
  }, [pendingSpaceId, activeTab, tabSpaceMap]);

  useEffect(() => {
    if (!commands) return;
    if (newTabOpen) {
      commands.hideView();
      commands.setContentBounds({ x: 0, y: 0, width: 0, height: 0 });
    } else {
      commands.showView();
    }
  }, [commands, newTabOpen]);

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (event: MouseEvent) => {
      if (sidebarCollapsed) return;
      const next = Math.min(420, Math.max(220, event.clientX - 28));
      setSidebarWidth(next);
    };
    const handleUp = () => setResizing(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizing, sidebarCollapsed]);

  const denseTabs = tabs.length > 6;

  const favorites =
    bookmarks.length > 0
      ? bookmarks.map((bookmark) => ({
          id: bookmark.id,
          name: bookmark.title,
          icon: "★",
          url: bookmark.url,
        }))
      : favoriteSeed;

  const activeTabs =
    activeSpaceId === "all"
      ? tabs
      : tabs.filter((tab) => tabSpaceMap[tab.id] === activeSpaceId);

  const computedSpaces = spacesState.map((space) => {
    const count = Object.values(tabSpaceMap).filter((id) => id === space.id).length;
    return { ...space, count };
  });

  const groupedTabs = (() => {
    if (tabGroups.length === 0) return null;
    const activeIds = new Set(activeTabs.map((tab) => tab.id));
    const tabsById = new Map(tabs.map((tab) => [tab.id, tab]));

    const visibleGroups = tabGroups
      .map((group) => ({
        ...group,
        tabs: group.tabIds
          .map((tabId) => tabsById.get(tabId))
          .filter((tab): tab is NonNullable<typeof tab> => !!tab)
          .filter((tab) => activeIds.has(tab.id)),
      }))
      .filter((group) => group.tabs.length > 0);

    const groupedIds = new Set(visibleGroups.flatMap((group) => group.tabs.map((tab) => tab.id)));
    const ungrouped = activeTabs.filter((tab) => !groupedIds.has(tab.id));

    return { groups: visibleGroups, ungrouped };
  })();

  // Entry point requested: tidyUpTabs(force = false).
  const tidyUpTabs = (force = false) => {
    const result = groupTabs({
      tabs,
      existingGroups: tabGroups,
      force,
      now: Date.now(),
    });

    // Snapshot before/after to enable undo later.
    tidySnapshotRef.current = { groups: tabGroups };
    setTabGroups(result.groups);
  };

  const handleAddSpace = () => {
    const name = `Space ${spacesState.length + 1}`;
    setSpacesState((prev) => [
      ...prev,
      {
        id: `space-${Date.now()}`,
        name,
        color: "#5b8f8a",
        count: 0,
      },
    ]);
  };

  const handleDeleteSpace = (id: string) => {
    setSpacesState((prev) => prev.filter((space) => space.id !== id));
    setTabSpaceMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((tabId) => {
        if (next[tabId] === id) delete next[tabId];
      });
      return next;
    });
  };

  const closeTabMenu = () => setTabMenu(null);

  const appContent = (
    <div className="lumen-content">
      <div
        className={`main-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
        style={{ ["--sidebar-width" as string]: `${sidebarWidth}px` }}
      >
        <Sidebar
          spaces={[{ id: "all", name: "All", color: "#7f8aa2", count: tabs.length }, ...computedSpaces]}
          favorites={favorites}
          onAddSpace={handleAddSpace}
          onDeleteSpace={handleDeleteSpace}
          activeSpaceId={activeSpaceId}
          onSelectSpace={(id) => setActiveSpaceId(id)}
          editingSpaceId={editingSpaceId}
          onStartRenameSpace={(id) => setEditingSpaceId(id)}
          onRenameSpace={(id, name) => {
            setSpacesState((prev) =>
              prev.map((space) => (space.id === id ? { ...space, name } : space))
            );
            setEditingSpaceId(null);
          }}
          onCancelRenameSpace={() => setEditingSpaceId(null)}
          tabs={activeTabs}
          tabGroups={groupedTabs?.groups}
          ungroupedTabs={groupedTabs?.ungrouped ?? []}
          activeTabId={activeTab?.id ?? null}
          onActivateTab={(id) => commands?.activateTab(id)}
          onCloseTab={(id) => commands?.closeTab(id)}
          onNewTab={() => setNewTabOpen(true)}
          onTidyUp={() => tidyUpTabs(false)}
          denseTabs={denseTabs}
          onTabContextMenu={(id, x, y) => setTabMenu({ id, x, y })}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          header={
            <div className="sidebar-controls">
              <div className="sidebar-topbar">
                <Omnibox
                  activeUrl={activeUrl}
                  onNavigate={handleNavigate}
                  onReload={() => commands?.reload()}
                  onBack={() => commands?.goBack()}
                  onForward={() => commands?.goForward()}
                  onBookmark={() => {
                    if (!commands || !activeTab?.url) return;
                    if (isBookmarked) {
                      const match = bookmarks.find(
                        (bookmark) => bookmark.url.toLowerCase() === activeTab.url.toLowerCase()
                      );
                      if (match) {
                        commands.bookmarks.remove(match.id);
                      }
                    } else {
                      commands.bookmarks.add(activeTab.url, activeTab.title || activeTab.url);
                    }
                    refreshBookmarks();
                    setBookmarksVisible(true);
                  }}
                  isBookmarked={isBookmarked}
                  mode="preview"
                  onCopyUrl={() => activeUrl && navigator.clipboard.writeText(activeUrl)}
                />
              </div>
              <div className="sidebar-actions">
                <button className="sidebar-btn" type="button" onClick={() => setNewTabOpen(true)}>
                  + New Tab
                </button>
                <button
                  className="sidebar-btn ghost"
                  type="button"
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                >
                  {sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                </button>
              </div>
            </div>
          }
        />
        <div
          className={`sidebar-resizer ${resizing ? "is-dragging" : ""}`}
          onMouseDown={() => setResizing(true)}
          role="separator"
          aria-label="Resize sidebar"
        />
        <BrowserSurface
          activeTab={activeTab}
          quickLinks={quickLinks}
          bookmarksVisible={bookmarksVisible}
          bookmarks={bookmarks}
          historyVisible={historyVisible}
          history={historyItems}
          downloadsVisible={downloadsVisible}
          downloads={downloads}
          suppressWeb={newTabOpen}
        />
      </div>
      {tabMenu && (
        <div className="tab-menu-overlay" onClick={closeTabMenu}>
          <div
            className="tab-menu"
            style={{ left: tabMenu.x, top: tabMenu.y }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tab-menu-title">Move to Space</div>
            {computedSpaces.map((space) => (
              <button
                key={space.id}
                className="tab-menu-item"
                type="button"
                onClick={() => {
                  setTabSpaceMap((prev) => ({ ...prev, [tabMenu.id]: space.id }));
                  closeTabMenu();
                }}
              >
                <span className="tab-menu-dot" style={{ background: space.color }} />
                {space.name}
              </button>
            ))}
            <button
              className="tab-menu-item"
              type="button"
              onClick={() => {
                handleAddSpace();
                closeTabMenu();
              }}
            >
              + New Space
            </button>
            <button
              className="tab-menu-item danger"
              type="button"
              onClick={() => {
                commands?.closeTab(tabMenu.id);
                closeTabMenu();
              }}
            >
              Close Tab
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`app ${isElectron ? "app-electron" : ""}`}>
      <div className="lumen-shell">
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          <span className="theme-toggle-icon">{theme === "dark" ? "☀︎" : "☾"}</span>
        </button>
        {isElectron ? appContent : <WindowFrame title="LUMEN">{appContent}</WindowFrame>}
      </div>
      <NewTabModal
        visible={newTabOpen}
        onClose={() => setNewTabOpen(false)}
        onSubmit={(value) => {
          const trimmed = value.trim();
          if (!commands) return;
          if (activeSpaceId !== "all") {
            setPendingSpaceId(activeSpaceId);
          }
          if (!trimmed) {
            commands.newTab();
            setNewTabOpen(false);
            return;
          }
          const hasScheme = /^[a-zA-Z][a-zA-Z\\d+.-]*:/.test(trimmed);
          const looksLikeSearch = trimmed.includes(" ") || (!trimmed.includes(".") && !hasScheme);
          let url = trimmed;
          if (looksLikeSearch) {
            url = `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
          } else if (!hasScheme) {
            url = `https://${trimmed}`;
          }
          commands.newTab(url, true);
          setNewTabOpen(false);
        }}
      />
    </div>
  );
};

export default App;
