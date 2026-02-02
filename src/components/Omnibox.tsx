import { useEffect, useState } from "react";

type OmniboxProps = {
  activeUrl: string;
  onNavigate: (input: string) => void;
  onReload: () => void;
  onBack: () => void;
  onForward: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
};

const Omnibox = ({
  activeUrl,
  onNavigate,
  onReload,
  onBack,
  onForward,
  onBookmark,
  isBookmarked,
}: OmniboxProps) => {
  const [value, setValue] = useState(activeUrl);

  useEffect(() => {
    setValue(activeUrl);
  }, [activeUrl]);

  return (
    <div className="omnibox">
      <div className="omnibox-actions">
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
        <span aria-hidden="true">🔒</span>
      </div>
      <input
        className="omnibox-input"
        placeholder="Search or enter website name"
        aria-label="Search or enter website name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onNavigate(value);
          }
        }}
        onBlur={() => {
          if (!value.trim()) {
            setValue(activeUrl);
          }
        }}
      />
      <div className="omnibox-actions">
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
