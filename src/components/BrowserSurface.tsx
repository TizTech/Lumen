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
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateLabel = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  const focusStacks = [
    { title: "Morning Review", detail: "Docs • Notes • Calendar" },
    { title: "Design Sprint", detail: "Figma • Drive • Loom" },
    { title: "Reading List", detail: "Articles • Research • Clips" },
  ];
  const rituals = [
    { title: "Capture Idea", detail: "Open a fresh tab and start typing." },
    { title: "Collect Sources", detail: "Bookmark a few links for later." },
  ];

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
      const x = rect.left;
      const y = rect.top;
      const width = rect.width;
      const height = rect.height;

      window.lumen?.setContentBounds({
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
          <div className="hero-grid">
            <div className="hero-intro">
              <div className="hero-kicker">Lumen</div>
              <h1 className="hero-title">A calmer window to the web.</h1>
              <p className="hero-tagline">
                Collect thoughts, shift contexts, and breathe before the next click. Your tabs are
                light, your spaces are intentional.
              </p>
              <div className="hero-actions">
                {quickLinks.map((link) => (
                  <div key={link.id} className="hero-action">
                    <span className="hero-action-icon">{link.icon}</span>
                    <span>{link.name}</span>
                  </div>
                ))}
              </div>
              <div className="hero-rituals">
                {rituals.map((ritual) => (
                  <div key={ritual.title} className="hero-ritual">
                    <div className="hero-ritual-title">{ritual.title}</div>
                    <div className="hero-ritual-detail">{ritual.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-side">
              <div className="hero-card hero-timecard">
                <div className="hero-time">{timeLabel}</div>
                <div className="hero-date">{dateLabel}</div>
                <div className="hero-sub">Quiet mode • Clean slate • New tab ready</div>
              </div>
              <div className="hero-card">
                <div className="hero-card-title">Focus stacks</div>
                <div className="hero-stack-list">
                  {focusStacks.map((stack) => (
                    <div key={stack.title} className="hero-stack">
                      <div className="hero-stack-title">{stack.title}</div>
                      <div className="hero-stack-detail">{stack.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hero-card hero-metrics">
                <div>
                  <div className="hero-metric-label">Open tabs</div>
                  <div className="hero-metric-value">2</div>
                </div>
                <div>
                  <div className="hero-metric-label">Active space</div>
                  <div className="hero-metric-value">Personal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default BrowserSurface;
