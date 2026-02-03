import { useEffect, useMemo, useState } from "react";

type OmniboxProps = {
  activeUrl: string;
  onNavigate: (input: string) => void;
  onReload: () => void;
  onBack: () => void;
  onForward: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
  mode?: "interactive" | "preview";
  onCopyUrl?: () => void;
};

const Omnibox = ({
  activeUrl,
  onNavigate,
  onReload,
  onBack,
  onForward,
  onBookmark,
  isBookmarked,
  mode = "interactive",
  onCopyUrl,
}: OmniboxProps) => {
  const [value, setValue] = useState(activeUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayValue = useMemo(() => {
    if (!activeUrl) return "New Tab";
    try {
      const parsed = new URL(activeUrl);
      const path = parsed.pathname === "/" ? "" : parsed.pathname;
      // State machine:
      // - Normal: host only
      // - Hovered: host + short path
      // - Editing: full URL (handled by value state)
      if (!isHovered) {
        return parsed.host;
      }
      const shortPath = path.length > 24 ? `${path.slice(0, 24)}…` : path;
      return `${parsed.host}${shortPath}`;
    } catch {
      return activeUrl;
    }
  }, [activeUrl, isHovered]);

  useEffect(() => {
    if (!isEditing) {
      setValue(activeUrl);
    }
  }, [activeUrl, isEditing]);

  return (
    <div
      className={`omnibox ${mode === "preview" ? "preview" : ""} ${isEditing ? "editing" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="omnibox-actions left">
        <button className="icon-button minimal" type="button" onClick={onBack} aria-label="Back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="icon-button minimal" type="button" onClick={onForward} aria-label="Forward">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <input
        className="omnibox-input"
        placeholder="Search or enter website name"
        aria-label="Search or enter website name"
        value={mode === "preview" && !isEditing ? displayValue : value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if ((mode === "interactive" || isEditing) && event.key === "Enter") {
            onNavigate(value);
            setIsEditing(false);
          }
          if (event.key === "Escape") {
            setIsEditing(false);
            setValue(activeUrl);
          }
        }}
        onBlur={() => {
          if (isEditing) {
            setIsEditing(false);
            setValue(activeUrl);
          } else if (!value.trim()) {
            setValue(activeUrl);
          }
        }}
        onClick={() => {
          if (mode === "preview" && !isEditing) {
            setIsEditing(true);
            setValue(activeUrl);
          }
        }}
        readOnly={mode === "preview" && !isEditing}
        style={{ ["--actions-width" as string]: isHovered && !isEditing ? "120px" : "0px" }}
      />
      <div className="omnibox-actions right">
        <button className="icon-button" type="button" aria-label="Refresh" onClick={onReload}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M20 12a8 8 0 1 1-2.34-5.66" />
            <path d="M20 4v6h-6" />
          </svg>
        </button>
        <button
          className={`icon-button ${isBookmarked ? "active" : ""}`}
          type="button"
          aria-label="Bookmark"
          onClick={onBookmark}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 4h12v16l-6-4-6 4z" />
          </svg>
        </button>
        {mode === "preview" && (
          <button className="icon-button" type="button" aria-label="Copy URL" onClick={onCopyUrl}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        )}
        <button className="icon-button" aria-label="Share">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 16V4" />
            <path d="M8 8l4-4 4 4" />
            <path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Omnibox;
