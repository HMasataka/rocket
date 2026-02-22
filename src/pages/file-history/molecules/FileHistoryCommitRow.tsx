import type { CommitInfo } from "../../../services/history";
import { formatRelativeDate } from "../../../utils/date";
import { refClass } from "../../../utils/refs";

interface FileHistoryCommitRowProps {
  commit: CommitInfo;
  isSelected: boolean;
  onSelect: (oid: string) => void;
}

export function FileHistoryCommitRow({
  commit,
  isSelected,
  onSelect,
}: FileHistoryCommitRowProps) {
  return (
    <button
      type="button"
      className={`fh-commit${isSelected ? " selected" : ""}`}
      onClick={() => onSelect(commit.oid)}
    >
      <div className="fh-commit-main">
        <span className="fh-commit-message">{commit.message}</span>
        {commit.refs.length > 0 && (
          <div className="fh-commit-refs">
            {commit.refs.map((ref) => (
              <span
                key={`${ref.kind}-${ref.name}`}
                className={refClass(ref.kind)}
              >
                {ref.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="fh-commit-meta">
        <span className="fh-commit-hash">{commit.short_oid}</span>
        <span className="fh-commit-author">{commit.author_name}</span>
        <span className="fh-commit-date">
          {formatRelativeDate(commit.author_date)}
        </span>
      </div>
    </button>
  );
}
