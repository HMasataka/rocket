interface StashFooterProps {
  hasSelection: boolean;
  onApply: () => void;
  onPop: () => void;
  onDrop: () => void;
}

export function StashFooter({
  hasSelection,
  onApply,
  onPop,
  onDrop,
}: StashFooterProps) {
  return (
    <div className="operation-footer">
      <div className="operation-summary" />
      <div className="operation-buttons">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!hasSelection}
          onClick={onApply}
        >
          Apply
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!hasSelection}
          onClick={onPop}
        >
          Pop
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={!hasSelection}
          onClick={onDrop}
        >
          Drop
        </button>
      </div>
    </div>
  );
}
