import { type Tab } from "../bridge/types";

type TabStripProps = {
  tabs: Tab[];
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
};

const TabStrip = ({ tabs, onActivate, onClose, onNewTab }: TabStripProps) => {
  return (
    <div className="tab-strip">
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className={`tab fade-in delay-${Math.min(index, 3)} ${tab.isActive ? "active" : ""}`}
          onClick={() => onActivate(tab.id)}
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
          <span>{tab.title || "New Tab"}</span>
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
      <button className="tab-add" type="button" onClick={onNewTab} aria-label="New tab">
        +
      </button>
    </div>
  );
};

export default TabStrip;
