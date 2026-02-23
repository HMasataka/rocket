import type { CommitInfo } from "../../../services/history";
import { formatRelativeDate } from "../../../utils/date";
import { refClass } from "../../../utils/refs";

interface CommitRowProps {
  commit: CommitInfo;
  isSelected: boolean;
  onSelect: (oid: string) => void;
}

export function CommitRow({ commit, isSelected, onSelect }: CommitRowProps) {
  return (
    <button
      type="button"
      className={`commit-row${isSelected ? " selected" : ""}`}
      onClick={() => onSelect(commit.oid)}
    >
      <div className="commit-info">
        <div className="commit-message-row">
          <span className="commit-message">{commit.message}</span>
          {commit.refs.map((ref) => (
            <span
              key={`${ref.kind}-${ref.name}`}
              className={refClass(ref.kind)}
            >
              {ref.name}
            </span>
          ))}
        </div>
        <div className="commit-meta">
          <span className="commit-hash">{commit.short_oid}</span>
          <span className="commit-author">{commit.author_name}</span>
          <span className="commit-date">
            {formatRelativeDate(commit.author_date)}
          </span>
        </div>
      </div>
    </button>
  );
}
