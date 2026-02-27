import type { CommitInfo } from "../../../services/history";
import { formatRelativeDate } from "../../../utils/date";

interface CherryPickCommitRowProps {
  commit: CommitInfo;
  selected: boolean;
  onToggle: (oid: string) => void;
}

export function CherryPickCommitRow({
  commit,
  selected,
  onToggle,
}: CherryPickCommitRowProps) {
  return (
    <button
      type="button"
      className={`cherry-commit-row${selected ? " selected" : ""}`}
      onClick={() => onToggle(commit.oid)}
    >
      <div className="cherry-checkbox">
        <input type="checkbox" checked={selected} readOnly tabIndex={-1} />
      </div>
      <div className="cherry-graph">
        <div className="graph-node cherry" />
        <div className="graph-line" />
      </div>
      <div className="cherry-info">
        <div className="cherry-message">{commit.message}</div>
        <div className="cherry-meta">
          <span className="cherry-hash">{commit.short_oid}</span>
          <span>{commit.author_name}</span>
          <span>{formatRelativeDate(commit.author_date)}</span>
        </div>
      </div>
    </button>
  );
}
