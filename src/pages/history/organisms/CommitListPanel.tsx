import { useRef } from "react";
import type {
  CommitGraphRow,
  CommitInfo,
  LogFilter,
} from "../../../services/history";
import { activeFilterCount } from "../../../utils/filter";
import { CommitGraph } from "../molecules/CommitGraph";
import { CommitRow } from "../molecules/CommitRow";
import { FilterPanel } from "./FilterPanel";

interface CommitListPanelProps {
  commits: CommitInfo[];
  graph: CommitGraphRow[];
  selectedOid: string | null;
  filter: LogFilter;
  filterOpen: boolean;
  loading: boolean;
  onSelectCommit: (oid: string) => void;
  onToggleFilter: () => void;
  onFilterChange: (filter: LogFilter) => void;
  onClearFilter: () => void;
  totalCount: number;
}

export function CommitListPanel({
  commits,
  graph,
  selectedOid,
  filter,
  filterOpen,
  loading,
  onSelectCommit,
  onToggleFilter,
  onFilterChange,
  onClearFilter,
  totalCount,
}: CommitListPanelProps) {
  const commitListRef = useRef<HTMLDivElement>(null);
  const filterCount = activeFilterCount(filter);

  return (
    <div className="history-panel">
      <div className="panel-toolbar">
        <div className="branch-legend" />
        <div className="toolbar-right">
          <button
            type="button"
            className={`filter-toggle${filterOpen ? " active" : ""}`}
            title="Toggle Filters"
            onClick={onToggleFilter}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
            </svg>
            <span>Filter</span>
            {filterCount > 0 && (
              <span className="filter-count">{filterCount}</span>
            )}
          </button>
        </div>
      </div>

      {filterOpen && (
        <FilterPanel
          filter={filter}
          onFilterChange={onFilterChange}
          onClearAll={onClearFilter}
          resultCount={commits.length}
          totalCount={totalCount}
        />
      )}

      <div className="commit-list-wrapper">
        {graph.length > 0 && (
          <CommitGraph graph={graph} syncScrollRef={commitListRef} />
        )}
        <div className="commit-list" ref={commitListRef}>
          {loading && commits.length === 0 && (
            <div className="history-empty">Loading...</div>
          )}
          {!loading && commits.length === 0 && (
            <div className="history-empty">No commits found</div>
          )}
          {commits.map((commit) => (
            <CommitRow
              key={commit.oid}
              commit={commit}
              isSelected={commit.oid === selectedOid}
              onSelect={onSelectCommit}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
