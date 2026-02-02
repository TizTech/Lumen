import { type Favorite, type Space } from "../bridge/types";

type SidebarProps = {
  spaces: Space[];
  favorites: Favorite[];
};

const Sidebar = ({ spaces, favorites }: SidebarProps) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">Spaces</div>
        {spaces.map((space, index) => (
          <div key={space.id} className={`sidebar-item fade-in delay-${Math.min(index, 3)}`}>
            <div className="sidebar-item-label">
              <span className="sidebar-dot" style={{ background: space.color }} />
              <span>{space.name}</span>
            </div>
            <span className="sidebar-count">{space.count}</span>
          </div>
        ))}
      </div>
      <div className="sidebar-section">
        <div className="sidebar-title">Favorites</div>
        {favorites.map((favorite, index) => (
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
    </aside>
  );
};

export default Sidebar;
