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
  suppressWeb?: boolean;
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
  suppressWeb = false,
}: BrowserSurfaceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showHero = !activeTab?.url;

  useEffect(() => {
    if (!window.lumen || !containerRef.current) {
      return;
    }

    const updateBounds = () => {
      const node = containerRef.current;
      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const styles = window.getComputedStyle(node);
      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingTop = parseFloat(styles.paddingTop) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      const paddingBottom = parseFloat(styles.paddingBottom) || 0;

      const hasWeb = activeTab?.url && !suppressWeb;
      const x = rect.left + (hasWeb ? paddingLeft : 0);
      const y = rect.top + (hasWeb ? paddingTop : 0);
      const width = rect.width - (hasWeb ? paddingLeft + paddingRight : 0);
      const height = rect.height - (hasWeb ? paddingTop + paddingBottom : 0);

      window.lumen.setContentBounds({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.max(0, Math.round(width)),
        height: Math.max(0, Math.round(height)),
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
  }, [activeTab?.id, activeTab?.url, suppressWeb]);

  useEffect(() => {
    if (!window.lumen) return;
    if (!activeTab?.url || suppressWeb) {
      window.lumen.setContentBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [activeTab?.url, suppressWeb]);

  return (
    <section
      ref={containerRef}
      className={`content-area ${activeTab?.url && !suppressWeb ? "has-web" : ""}`}
    >
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
