import { useCommitSearch } from "../../../hooks/useCommitSearch";
import type { CommitInfo } from "../../../services/history";
import { RevertCommitRow } from "../molecules/RevertCommitRow";

interface RevertCommitListProps {
  commits: CommitInfo[];
  selectedOid: string | null;
  onSelect: (oid: string) => void;
}

export function RevertCommitList({
  commits,
  selectedOid,
  onSelect,
}: RevertCommitListProps) {
  const { search, setSearch, filtered } = useCommitSearch(commits);

  return (
    <div className="operation-panel">
      <div className="panel-header">
        <span className="panel-title">Select commit to revert</span>
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
      <div className="revert-commit-list">
        {filtered.map((commit) => (
          <RevertCommitRow
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
