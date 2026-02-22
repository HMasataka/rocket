import type { CommitInfo } from "../../../services/history";
import { FileHistoryCommitRow } from "../molecules/FileHistoryCommitRow";

interface FileHistoryListPanelProps {
  commits: CommitInfo[];
  selectedOid: string | null;
  loading: boolean;
  onSelectCommit: (oid: string) => void;
}

export function FileHistoryListPanel({
  commits,
  selectedOid,
  loading,
  onSelectCommit,
}: FileHistoryListPanelProps) {
  return (
    <div className="fh-list-panel">
      <div className="fh-commit-list">
        {loading && commits.length === 0 && (
          <div className="history-empty">Loading...</div>
        )}
        {!loading && commits.length === 0 && (
          <div className="history-empty">No commits found</div>
        )}
        {commits.map((commit) => (
          <FileHistoryCommitRow
            key={commit.oid}
            commit={commit}
            isSelected={commit.oid === selectedOid}
            onSelect={onSelectCommit}
          />
        ))}
      </div>
    </div>
  );
}
