import { type BookmarkEntry } from "../bridge/types";

type BookmarksPanelProps = {
  items: BookmarkEntry[];
  visible: boolean;
};

const BookmarksPanel = ({ items, visible }: BookmarksPanelProps) => {
  if (!visible) return null;
  return (
    <div className="panel panel-bookmarks">
      <div className="panel-title">Bookmarks</div>
      {items.length === 0 && <div className="panel-empty">No bookmarks yet.</div>}
      {items.map((item) => (
        <div key={item.id} className="panel-item">
          <div>{item.title}</div>
          <div className="panel-sub">{item.url}</div>
        </div>
      ))}
    </div>
  );
};

export default BookmarksPanel;
