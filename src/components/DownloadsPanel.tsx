import { type DownloadItem } from "../bridge/types";

type DownloadsPanelProps = {
  items: DownloadItem[];
  visible: boolean;
};

const DownloadsPanel = ({ items, visible }: DownloadsPanelProps) => {
  if (!visible) return null;
  return (
    <div className="panel panel-downloads">
      <div className="panel-title">Downloads</div>
      {items.length === 0 && <div className="panel-empty">No downloads yet.</div>}
      {items.map((item) => (
        <div key={item.id} className="panel-item">
          <div>{item.filename}</div>
          <div className="panel-sub">
            {Math.round(item.receivedBytes / 1024)} KB / {Math.round(item.totalBytes / 1024)} KB
          </div>
        </div>
      ))}
    </div>
  );
};

export default DownloadsPanel;
