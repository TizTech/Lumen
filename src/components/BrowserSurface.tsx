import { useEffect, useRef } from "react";
import { type QuickLink, type Tab } from "../bridge/types";
import BookmarksPanel from "./BookmarksPanel";
import HistoryPanel from "./HistoryPanel";
import DownloadsPanel from "./DownloadsPanel";

type BrowserSurfaceProps = {
  activeTab: Tab | null;
  quickLinks: QuickLink[];
  bookmarksVisible: boolean;
  bookmarks: import("../bridge/types").BookmarkEntry[];
  historyVisible: boolean;
  history: import("../bridge/types").HistoryEntry[];
  downloadsVisible: boolean;
  downloads: import("../bridge/types").DownloadItem[];
};

const BrowserSurface = ({
  activeTab,
  quickLinks,
  bookmarksVisible,
  bookmarks,
  historyVisible,
  history,
  downloadsVisible,
  downloads,
}: BrowserSurfaceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showHero = !activeTab?.url;

  useEffect(() => {
    if (!window.lumen || !containerRef.current) {
      return;
    }

    const updateBounds = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      window.lumen.setContentBounds({
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    const scheduleUpdate = () => {
      requestAnimationFrame(updateBounds);
    };

    scheduleUpdate();

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [activeTab?.id, activeTab?.url]);

  useEffect(() => {
    if (!window.lumen) return;
    if (!activeTab?.url) {
      window.lumen.setContentBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [activeTab?.url]);

  return (
    <section ref={containerRef} className="content-area">
      <BookmarksPanel visible={bookmarksVisible} items={bookmarks} />
      <HistoryPanel visible={historyVisible} items={history} />
      <DownloadsPanel visible={downloadsVisible} items={downloads} />
      {showHero && (
        <div className="hero-surface" aria-hidden={!showHero}>
          <div className="hero">
            <h1 className="hero-title">Lumen</h1>
            <p className="hero-tagline">
              A calmer window to the web. Collect thoughts, shift contexts, and breathe before the
              next click.
            </p>
          </div>
          <div className="quick-links">
            {quickLinks.map((link) => (
              <div key={link.id} className="quick-link">
                <span className="quick-icon">{link.icon}</span>
                <span>{link.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default BrowserSurface;
