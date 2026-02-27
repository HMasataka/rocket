import type { CommitInfo } from "../../../services/history";
import { formatRelativeDate } from "../../../utils/date";

interface ResetCommitRowProps {
  commit: CommitInfo;
  selected: boolean;
  onSelect: (oid: string) => void;
}

export function ResetCommitRow({
  commit,
  selected,
  onSelect,
}: ResetCommitRowProps) {
  return (
    <button
      type="button"
      className={`reset-commit-row${selected ? " selected" : ""}`}
      onClick={() => onSelect(commit.oid)}
    >
      <div className="reset-radio">
        <input
          type="radio"
          name="reset-commit"
          value={commit.oid}
          checked={selected}
          readOnly
          tabIndex={-1}
        />
      </div>
      <div className="reset-graph">
        <div className="graph-node reset" />
        <div className="graph-line" />
      </div>
      <div className="reset-info">
        <div className="reset-message">{commit.message}</div>
        <div className="reset-meta">
          <span className="reset-hash">{commit.short_oid}</span>
          <span>{commit.author_name}</span>
          <span>{formatRelativeDate(commit.author_date)}</span>
        </div>
      </div>
    </button>
  );
}
