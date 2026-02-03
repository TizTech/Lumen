import { type Favorite, type Space, type Tab } from "../bridge/types";
import { useState } from "react";
import type { ReactNode } from "react";
import TabStrip from "./TabStrip";

type SidebarProps = {
  spaces: Space[];
  favorites: Favorite[];
  header?: ReactNode;
  onAddSpace?: () => void;
  onDeleteSpace?: (id: string) => void;
  activeSpaceId?: string;
  onSelectSpace?: (id: string) => void;
  tabs: Tab[];
  activeTabId?: string | null;
  onActivateTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  denseTabs?: boolean;
  onTabContextMenu?: (id: string, x: number, y: number) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  editingSpaceId?: string | null;
  onStartRenameSpace?: (id: string) => void;
  onRenameSpace?: (id: string, name: string) => void;
  onCancelRenameSpace?: () => void;
};

const Sidebar = ({
  spaces,
  favorites,
  header,
  onAddSpace,
  onDeleteSpace,
  activeSpaceId,
  onSelectSpace,
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onNewTab,
  denseTabs,
  onTabContextMenu,
  collapsed = false,
  onToggleCollapse,
  editingSpaceId,
  onStartRenameSpace,
  onRenameSpace,
  onCancelRenameSpace,
}: SidebarProps) => {
  const [spacesCollapsed, setSpacesCollapsed] = useState(true);
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(true);

  return (
    <aside className="sidebar">
      {collapsed && (
        <div className="sidebar-rail">
          <button className="sidebar-icon-btn" type="button" onClick={onToggleCollapse} aria-label="Show sidebar">
            ›
          </button>
          <div className="rail-section">
            {spaces.map((space) => (
              <button
                key={space.id}
                className={`rail-dot ${activeSpaceId === space.id ? "active" : ""}`}
                style={{ background: space.color }}
                onClick={() => onSelectSpace?.(space.id)}
                aria-label={space.name}
                type="button"
              />
            ))}
          </div>
          <div className="rail-section">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`rail-tab ${tab.id === activeTabId ? "active" : ""}`}
                onClick={() => onActivateTab(tab.id)}
                aria-label={tab.title}
                type="button"
              >
                {tab.favicon ? (
                  tab.favicon.startsWith("http") ? (
                    <img src={tab.favicon} alt="" />
                  ) : (
                    tab.favicon
                  )
                ) : (
                  "•"
                )}
              </button>
            ))}
            <button className="rail-tab add" type="button" onClick={onNewTab} aria-label="New tab">
              +
            </button>
          </div>
        </div>
      )}
      {header && <div className="sidebar-header">{header}</div>}
      <div className="sidebar-section">
        <div className="sidebar-title-row">
          <button
            className="sidebar-title toggle"
            type="button"
            onClick={() => setSpacesCollapsed(!spacesCollapsed)}
          >
            Spaces
            <span>{spacesCollapsed ? "+" : "–"}</span>
          </button>
          <button className="sidebar-icon-btn" type="button" onClick={onAddSpace} aria-label="Add space">
            +
          </button>
        </div>
        {!spacesCollapsed &&
          spaces.map((space, index) => (
            <button
              key={space.id}
              type="button"
              className={`sidebar-item fade-in delay-${Math.min(index, 3)} ${
                activeSpaceId === space.id ? "active" : ""
              }`}
              onClick={() => onSelectSpace?.(space.id)}
            >
              <div className="sidebar-item-label">
                <span className="sidebar-dot" style={{ background: space.color }} />
                {editingSpaceId === space.id && space.id !== "all" ? (
                  <input
                    className="space-rename"
                    defaultValue={space.name}
                    autoFocus
                    onBlur={(event) => onRenameSpace?.(space.id, event.target.value.trim() || space.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onRenameSpace?.(space.id, (event.target as HTMLInputElement).value.trim() || space.name);
                      }
                      if (event.key === "Escape") {
                        onCancelRenameSpace?.();
                      }
                    }}
                  />
                ) : (
                <span
                  onClick={(event) => {
                    event.stopPropagation();
                    if (space.id !== "all") {
                      onStartRenameSpace?.(space.id);
                    }
                  }}
                >
                  {space.name}
                </span>
                )}
              </div>
              <div className="sidebar-item-actions">
                <span className="sidebar-count">{space.count}</span>
                {space.id !== "all" && (
                  <button
                    className="sidebar-icon-btn ghost"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSpace?.(space.id);
                    }}
                    aria-label={`Delete ${space.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </button>
          ))}
      </div>
      <div className="sidebar-section">
        <button
          className="sidebar-title toggle"
          type="button"
          onClick={() => setFavoritesCollapsed(!favoritesCollapsed)}
        >
          Favorites
          <span>{favoritesCollapsed ? "+" : "–"}</span>
        </button>
        {!favoritesCollapsed &&
          favorites.map((favorite, index) => (
            <div key={favorite.id} className={`sidebar-item fade-in delay-${Math.min(index + 1, 3)}`}>
              <div className="sidebar-item-label">
                <span>{favorite.icon}</span>
                <div>
                  <div>{favorite.name}</div>
                  <div className="sidebar-count">{favorite.url}</div>
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="tabs-section">
        <div className="tabs-section-header">
          <div className="tabs-section-title">Tabs</div>
          <button className="tabs-section-btn" type="button" onClick={onNewTab}>
            +
          </button>
        </div>
        <TabStrip
          tabs={tabs}
          onActivate={onActivateTab}
          onClose={onCloseTab}
          onNewTab={onNewTab}
          orientation="vertical"
          dense={denseTabs}
          onContextMenu={onTabContextMenu}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
