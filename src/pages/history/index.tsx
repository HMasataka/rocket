import { useCallback, useEffect } from "react";
import { useHistoryStore } from "../../stores/historyStore";
import { useUIStore } from "../../stores/uiStore";
import { CommitDetailPanel } from "./organisms/CommitDetailPanel";
import { CommitListPanel } from "./organisms/CommitListPanel";

const INITIAL_LIMIT = 100;

export function HistoryPage() {
  const commits = useHistoryStore((s) => s.commits);
  const graph = useHistoryStore((s) => s.graph);
  const selectedCommitOid = useHistoryStore((s) => s.selectedCommitOid);
  const commitDetail = useHistoryStore((s) => s.commitDetail);
  const filter = useHistoryStore((s) => s.filter);
  const filterOpen = useHistoryStore((s) => s.filterOpen);
  const loading = useHistoryStore((s) => s.loading);
  const expandedFileDiffs = useHistoryStore((s) => s.expandedFileDiffs);
  const fetchCommitLog = useHistoryStore((s) => s.fetchCommitLog);
  const selectCommit = useHistoryStore((s) => s.selectCommit);
  const setFilter = useHistoryStore((s) => s.setFilter);
  const toggleFilter = useHistoryStore((s) => s.toggleFilter);
  const clearFilter = useHistoryStore((s) => s.clearFilter);
  const fetchFileDiff = useHistoryStore((s) => s.fetchFileDiff);
  const collapseFileDiff = useHistoryStore((s) => s.collapseFileDiff);
  const addToast = useUIStore((s) => s.addToast);
  const openBlame = useUIStore((s) => s.openBlame);
  const openFileHistory = useUIStore((s) => s.openFileHistory);

  useEffect(() => {
    fetchCommitLog(INITIAL_LIMIT, 0).catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchCommitLog, addToast]);

  const handleFilterChange = useCallback(
    (newFilter: typeof filter) => {
      setFilter(newFilter);
      fetchCommitLog(INITIAL_LIMIT, 0).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [setFilter, fetchCommitLog, addToast],
  );

  const handleClearFilter = useCallback(() => {
    clearFilter();
    fetchCommitLog(INITIAL_LIMIT, 0).catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [clearFilter, fetchCommitLog, addToast]);

  const handleSelectCommit = useCallback(
    (oid: string) => {
      selectCommit(oid).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [selectCommit, addToast],
  );

  const handleToggleFile = useCallback(
    (path: string) => {
      if (path in expandedFileDiffs) {
        collapseFileDiff(path);
      } else if (selectedCommitOid) {
        fetchFileDiff(selectedCommitOid, path).catch((e: unknown) => {
          addToast(String(e), "error");
        });
      }
    },
    [
      expandedFileDiffs,
      selectedCommitOid,
      fetchFileDiff,
      collapseFileDiff,
      addToast,
    ],
  );

  const handleOpenBlame = useCallback(
    (path: string, commitOid: string) => {
      openBlame(path, commitOid);
    },
    [openBlame],
  );

  const handleOpenFileHistory = useCallback(
    (path: string) => {
      openFileHistory(path);
    },
    [openFileHistory],
  );

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-info">
          <h2 className="page-title">History</h2>
          <span className="page-desc">
            Browse commit history and view changes
          </span>
        </div>
      </div>
      <div className="history-content">
        <CommitListPanel
          commits={commits}
          graph={graph}
          selectedOid={selectedCommitOid}
          filter={filter}
          filterOpen={filterOpen}
          loading={loading}
          onSelectCommit={handleSelectCommit}
          onToggleFilter={toggleFilter}
          onFilterChange={handleFilterChange}
          onClearFilter={handleClearFilter}
          totalCount={commits.length}
        />
        <CommitDetailPanel
          detail={commitDetail}
          expandedFileDiffs={expandedFileDiffs}
          onToggleFile={handleToggleFile}
          onOpenBlame={handleOpenBlame}
          onOpenFileHistory={handleOpenFileHistory}
        />
      </div>
    </div>
  );
}
