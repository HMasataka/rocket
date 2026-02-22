import { useCallback, useEffect } from "react";
import { useHistoryStore } from "../../stores/historyStore";
import { useUIStore } from "../../stores/uiStore";
import { FileHistoryDetailPanel } from "./organisms/FileHistoryDetailPanel";
import { FileHistoryListPanel } from "./organisms/FileHistoryListPanel";

const INITIAL_LIMIT = 100;

export function FileHistoryPage() {
  const fileHistoryTarget = useUIStore((s) => s.fileHistoryTarget);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const addToast = useUIStore((s) => s.addToast);
  const openBlame = useUIStore((s) => s.openBlame);
  const fileHistoryCommits = useHistoryStore((s) => s.fileHistoryCommits);
  const fileHistorySelectedOid = useHistoryStore(
    (s) => s.fileHistorySelectedOid,
  );
  const fileHistoryDetail = useHistoryStore((s) => s.fileHistoryDetail);
  const fileHistoryLoading = useHistoryStore((s) => s.fileHistoryLoading);
  const fetchFileHistory = useHistoryStore((s) => s.fetchFileHistory);
  const selectFileHistoryCommit = useHistoryStore(
    (s) => s.selectFileHistoryCommit,
  );
  const clearFileHistory = useHistoryStore((s) => s.clearFileHistory);

  useEffect(() => {
    if (!fileHistoryTarget) {
      setActivePage("history");
      return;
    }
    fetchFileHistory(fileHistoryTarget.path, INITIAL_LIMIT, 0).catch(
      (e: unknown) => {
        addToast(String(e), "error");
      },
    );
    return () => {
      clearFileHistory();
    };
  }, [
    fileHistoryTarget,
    fetchFileHistory,
    clearFileHistory,
    setActivePage,
    addToast,
  ]);

  const handleSelectCommit = useCallback(
    (oid: string) => {
      selectFileHistoryCommit(oid).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [selectFileHistoryCommit, addToast],
  );

  if (!fileHistoryTarget) return null;

  const pathParts = fileHistoryTarget.path.split("/");
  const fileName = pathParts.pop() ?? "";
  const dirPath = pathParts.length > 0 ? `${pathParts.join("/")}/` : "";

  return (
    <div className="page-layout">
      <div className="fh-header">
        <div className="fh-file-info">
          <svg
            className="fh-file-icon"
            viewBox="0 0 16 16"
            fill="currentColor"
            role="presentation"
          >
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5z" />
          </svg>
          <div className="fh-file-path">
            <span className="fh-path-dir">{dirPath}</span>
            <span className="fh-path-name">{fileName}</span>
          </div>
          <span className="fh-commit-count">
            {fileHistoryCommits.length} commits
          </span>
        </div>
        <div className="fh-actions">
          <button
            type="button"
            className="icon-btn"
            title="Back to History"
            onClick={() => setActivePage("history")}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Blame"
            onClick={() => openBlame(fileHistoryTarget.path, null)}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
              <path d="M4 4h8v1H4V4zm0 2.5h8v1H4v-1zm0 2.5h8v1H4V9zm0 2.5h5v1H4v-1z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="fh-content">
        <FileHistoryListPanel
          commits={fileHistoryCommits}
          selectedOid={fileHistorySelectedOid}
          loading={fileHistoryLoading}
          onSelectCommit={handleSelectCommit}
        />
        <FileHistoryDetailPanel detail={fileHistoryDetail} />
      </div>
    </div>
  );
}
