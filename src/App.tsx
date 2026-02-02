import { useEffect, useState } from "react";
import WindowFrame from "./components/WindowFrame";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import BrowserSurface from "./components/BrowserSurface";
import useTabs from "./hooks/useTabs";
import { type Favorite, type QuickLink, type Space } from "./bridge/types";

const spaces: Space[] = [
  { id: "space-1", name: "Personal", color: "#6f92d7", count: 5 },
  { id: "space-2", name: "Studio", color: "#5b8f8a", count: 8 },
  { id: "space-3", name: "Research", color: "#c89b7b", count: 3 },
];

const favorites: Favorite[] = [
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
  const [bookmarksVisible, setBookmarksVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyItems, setHistoryItems] = useState<import("./bridge/types").HistoryEntry[]>([]);
  const [downloadsVisible, setDownloadsVisible] = useState(false);
  const [downloads, setDownloads] = useState<import("./bridge/types").DownloadItem[]>([]);

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
      if (event.metaKey && event.key.toLowerCase() === "b") {
        setBookmarksVisible((prev) => !prev);
      }
      if (event.metaKey && event.key.toLowerCase() === "j") {
        setDownloadsVisible((prev) => !prev);
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

  return (
    <div className="app">
      <div className="lumen-shell">
        <WindowFrame title="LUMEN">
          <TopBar
            tabs={tabs}
            activeTab={activeTab}
            onActivateTab={(id) => commands?.activateTab(id)}
            onCloseTab={(id) => commands?.closeTab(id)}
            onNewTab={() => commands?.newTab()}
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
          />
          <div className="main-layout">
            <Sidebar spaces={spaces} favorites={favorites} />
            <BrowserSurface
              activeTab={activeTab}
              quickLinks={quickLinks}
              bookmarksVisible={bookmarksVisible}
              bookmarks={bookmarks}
              historyVisible={historyVisible}
              history={historyItems}
              downloadsVisible={downloadsVisible}
              downloads={downloads}
            />
          </div>
        </WindowFrame>
      </div>
    </div>
  );
};

export default App;
