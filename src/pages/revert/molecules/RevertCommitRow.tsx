import type { CommitInfo } from "../../../services/history";
import { formatRelativeDate } from "../../../utils/date";

interface RevertCommitRowProps {
  commit: CommitInfo;
  selected: boolean;
  onSelect: (oid: string) => void;
}

export function RevertCommitRow({
  commit,
  selected,
  onSelect,
}: RevertCommitRowProps) {
  return (
    <button
      type="button"
      className={`revert-commit-row${selected ? " selected" : ""}`}
      onClick={() => onSelect(commit.oid)}
    >
      <div className="revert-radio">
        <input
          type="radio"
          name="revert-commit"
          value={commit.oid}
          checked={selected}
          readOnly
          tabIndex={-1}
        />
      </div>
      <div className="revert-graph">
        <div className="graph-node revert" />
        <div className="graph-line" />
      </div>
      <div className="revert-info">
        <div className="revert-message">{commit.message}</div>
        <div className="revert-meta">
          <span className="revert-hash">{commit.short_oid}</span>
          <span>{commit.author_name}</span>
          <span>{formatRelativeDate(commit.author_date)}</span>
        </div>
      </div>
    </button>
  );
}
