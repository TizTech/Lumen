import { type Tab } from "../bridge/types";

type TabStripProps = {
  tabs: Tab[];
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
  orientation?: "horizontal" | "vertical";
  dense?: boolean;
  onContextMenu?: (id: string, x: number, y: number) => void;
  showAddButton?: boolean;
};

const TabStrip = ({
  tabs,
  onActivate,
  onClose,
  onNewTab,
  orientation = "horizontal",
  dense = false,
  onContextMenu,
  showAddButton = true,
}: TabStripProps) => {
  return (
    <div
      className={`tab-strip ${orientation === "vertical" ? "vertical" : ""} ${
        dense ? "dense" : ""
      }`}
    >
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className={`tab fade-in delay-${Math.min(index, 3)} ${tab.isActive ? "active" : ""}`}
          onClick={() => onActivate(tab.id)}
          onContextMenu={(event) => {
            if (!onContextMenu) return;
            event.preventDefault();
            onContextMenu(tab.id, event.clientX, event.clientY);
          }}
        >
          <span className="tab-favicon">
            {tab.favicon ? (
              tab.favicon.startsWith("http") ? (
                <img src={tab.favicon} alt="" />
              ) : (
                tab.favicon
              )
            ) : (
              "◦"
            )}
          </span>
          <span className="tab-title" title={tab.title || "New Tab"}>
            {tab.title || "New Tab"}
          </span>
          {tab.isLoading && <span className="tab-loading" aria-label="Loading">•</span>}
          <button
            className="tab-close"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose(tab.id);
            }}
            aria-label={`Close ${tab.title}`}
          >
            ×
          </button>
        </div>
      ))}
      {showAddButton && (
        <button className="tab-add" type="button" onClick={onNewTab} aria-label="New tab">
          +
        </button>
      )}
    </div>
  );
};

export default TabStrip;
