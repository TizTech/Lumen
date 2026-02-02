import { type HistoryEntry } from "../bridge/types";

type HistoryPanelProps = {
  items: HistoryEntry[];
  visible: boolean;
};

const HistoryPanel = ({ items, visible }: HistoryPanelProps) => {
  if (!visible) return null;
  return (
    <div className="panel panel-history">
      <div className="panel-title">History</div>
      {items.length === 0 && <div className="panel-empty">No history yet.</div>}
      {items.slice(0, 20).map((item) => (
        <div key={item.id} className="panel-item">
          <div>{item.title}</div>
          <div className="panel-sub">{item.url}</div>
        </div>
      ))}
    </div>
  );
};

export default HistoryPanel;
