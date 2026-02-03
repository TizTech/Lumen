import { useEffect, useRef, useState } from "react";

type NewTabModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
};

const NewTabModal = ({ visible, onClose, onSubmit }: NewTabModalProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="newtab-overlay" onClick={onClose}>
      <div className="newtab-modal" onClick={(event) => event.stopPropagation()}>
        <div className="newtab-title">New Tab</div>
        <input
          ref={inputRef}
          className="newtab-input"
          placeholder="Search or enter URL"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit(value);
            }
            if (event.key === "Escape") {
              onClose();
            }
          }}
        />
        <div className="newtab-actions">
          <button className="newtab-btn ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="newtab-btn" type="button" onClick={() => onSubmit(value)}>
            Open
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTabModal;
