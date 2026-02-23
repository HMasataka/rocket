import type { BranchInfo } from "../../../services/git";

interface BranchFooterProps {
  branch: BranchInfo | null;
  onSwitch: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function BranchFooter({
  branch,
  onSwitch,
  onRename,
  onDelete,
}: BranchFooterProps) {
  if (!branch) {
    return null;
  }

  return (
    <div className="operation-footer">
      <div className="operation-summary">
        <span className="summary-stat">
          <strong>{branch.name}</strong>
        </span>
        <span className="summary-divider" />
        <span className="summary-stat">
          <span style={{ color: "var(--text-muted)" }}>
            {"\u2191"}
            {branch.ahead_count}
          </span>
        </span>
        <span className="summary-stat">
          <span style={{ color: "var(--text-muted)" }}>
            {"\u2193"}
            {branch.behind_count}
          </span>
        </span>
        <span className="summary-divider" />
        <span className="summary-stat">{branch.upstream ?? "Local only"}</span>
      </div>
      <div className="operation-buttons">
        {!branch.is_remote && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onRename}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
            </svg>
            Rename
          </button>
        )}
        {!branch.is_head && !branch.is_remote && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1z" />
            </svg>
            Delete
          </button>
        )}
        {!branch.is_head && !branch.is_remote && (
          <button type="button" className="btn btn-primary" onClick={onSwitch}>
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
            Switch
          </button>
        )}
      </div>
    </div>
  );
}
