import { useCommitSearch } from "../../../hooks/useCommitSearch";
import type { CommitInfo } from "../../../services/history";
import { CherryPickCommitRow } from "../molecules/CherryPickCommitRow";

interface CherryPickCommitListProps {
  commits: CommitInfo[];
  selectedOids: Set<string>;
  onToggle: (oid: string) => void;
}

export function CherryPickCommitList({
  commits,
  selectedOids,
  onToggle,
}: CherryPickCommitListProps) {
  const { search, setSearch, filtered } = useCommitSearch(commits);

  return (
    <div className="operation-panel">
      <div className="panel-header">
        <span className="panel-title">Select commits to apply</span>
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
      <div className="cherry-commit-list">
        {filtered.map((commit) => (
          <CherryPickCommitRow
            key={commit.oid}
            commit={commit}
            selected={selectedOids.has(commit.oid)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
