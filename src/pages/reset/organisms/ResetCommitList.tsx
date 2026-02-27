import { useCommitSearch } from "../../../hooks/useCommitSearch";
import type { CommitInfo } from "../../../services/history";
import { ResetCommitRow } from "../molecules/ResetCommitRow";

interface ResetCommitListProps {
  commits: CommitInfo[];
  selectedOid: string | null;
  onSelect: (oid: string) => void;
}

export function ResetCommitList({
  commits,
  selectedOid,
  onSelect,
}: ResetCommitListProps) {
  const { search, setSearch, filtered } = useCommitSearch(commits);

  return (
    <div className="operation-panel">
      <div className="panel-header">
        <span className="panel-title">Select commit to reset to</span>
        <div className="panel-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search commits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="reset-commit-list">
        {filtered.map((commit) => (
          <ResetCommitRow
            key={commit.oid}
            commit={commit}
            selected={selectedOid === commit.oid}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
