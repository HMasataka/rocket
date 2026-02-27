import { useCallback, useEffect } from "react";

interface HardResetDialogProps {
  commitOid: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function HardResetDialog({
  commitOid,
  onConfirm,
  onCancel,
}: HardResetDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: overlay backdrop dismiss is mouse-only by design */}
      <div
        className="modal-overlay active"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="modal active">
        <div className="modal-header">
          <span className="modal-title">Hard Reset</span>
          <button type="button" className="modal-close" onClick={onCancel}>
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p>
            This will permanently discard all uncommitted changes and move HEAD
            to <code>{commitOid.slice(0, 7)}</code>.
          </p>
          <p>
            <strong>This operation cannot be undone.</strong>
          </p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Hard Reset
          </button>
        </div>
      </div>
    </>
  );
}
