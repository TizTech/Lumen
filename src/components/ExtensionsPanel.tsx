import { useEffect, useMemo, useState } from "react";
import type { ExtensionInfo } from "../bridge/types";

type ExtensionsPanelProps = {
  visible: boolean;
  onClose: () => void;
  onOpenStore: () => void;
  statusMessage?: string | null;
  errorMessage?: string | null;
  isInstalling?: boolean;
};

const ExtensionsPanel = ({
  visible,
  onClose,
  onOpenStore,
  statusMessage,
  errorMessage,
  isInstalling = false,
}: ExtensionsPanelProps) => {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [extensionId, setExtensionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isElectron = typeof window !== "undefined" && !!window.lumen;

  const sortedExtensions = useMemo(
    () => [...extensions].sort((a, b) => a.name.localeCompare(b.name)),
    [extensions]
  );

  const refresh = async () => {
    if (!window.lumen) return;
    const list = await window.lumen.extensions.list();
    setExtensions(list);
  };

  useEffect(() => {
    if (!visible || !window.lumen) return;
    void refresh();
  }, [visible]);

  const handleLoadUnpacked = async () => {
    if (!window.lumen) return;
    setError(null);
    try {
      const list = await window.lumen.extensions.loadUnpacked();
      setExtensions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load extension.");
    }
  };

  const handleInstall = async () => {
    if (!window.lumen) return;
    setError(null);
    try {
      const list = await window.lumen.extensions.installFromWebStore(extensionId);
      setExtensions(list);
      setExtensionId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to install extension.");
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.lumen) return;
    setError(null);
    try {
      const list = await window.lumen.extensions.remove(id);
      setExtensions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove extension.");
    }
  };

  if (!visible) return null;
  const mergedError = errorMessage ?? error;

  return (
    <div className="extensions-overlay" onClick={onClose}>
      <div className="extensions-panel" onClick={(event) => event.stopPropagation()}>
        <div className="extensions-header">
          <div>
            <div className="extensions-title">Extensions</div>
            <div className="extensions-subtitle">Add Chrome extensions or load unpacked builds.</div>
          </div>
          <button className="extensions-close" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {!isElectron && (
          <div className="extensions-callout">Extensions are available in the desktop app only.</div>
        )}

        {statusMessage && <div className="extensions-status">{statusMessage}</div>}

        <div className="extensions-actions">
          <button className="extensions-btn" type="button" onClick={handleLoadUnpacked}>
            Load Unpacked
          </button>
          <button className="extensions-btn ghost" type="button" onClick={onOpenStore}>
            Open Chrome Web Store
          </button>
        </div>

        <div className="extensions-install">
          <label htmlFor="extension-id">Install by ID</label>
          <div className="extensions-install-row">
            <input
              id="extension-id"
              className="extensions-input"
              placeholder="Paste extension ID (32 chars)"
              value={extensionId}
              onChange={(event) => setExtensionId(event.target.value)}
            />
            <button className="extensions-btn" type="button" onClick={handleInstall}>
              {isInstalling ? "Installing…" : "Install"}
            </button>
          </div>
          <div className="extensions-hint">
            Tip: open the Chrome Web Store, copy the extension ID, then install here.
          </div>
        </div>

        {mergedError && <div className="extensions-error">{mergedError}</div>}

        <div className="extensions-list">
          {sortedExtensions.length === 0 && (
            <div className="extensions-empty">No extensions installed yet.</div>
          )}
          {sortedExtensions.map((extension) => (
            <div key={extension.id} className="extensions-item">
              <div>
                <div className="extensions-item-title">{extension.name}</div>
                <div className="extensions-item-sub">
                  {extension.id} · v{extension.version} · {extension.source === "webstore" ? "Web Store" : "Unpacked"}
                </div>
              </div>
              <button
                className="extensions-btn ghost danger"
                type="button"
                onClick={() => handleRemove(extension.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExtensionsPanel;
