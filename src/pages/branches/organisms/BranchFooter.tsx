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
      </div>
      <div className="operation-buttons">
        <button type="button" className="btn btn-secondary" onClick={onRename}>
          Rename
        </button>
        {!branch.is_head && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            Delete
          </button>
        )}
        {!branch.is_head && (
          <button type="button" className="btn btn-primary" onClick={onSwitch}>
            Switch
          </button>
        )}
      </div>
    </div>
  );
}
