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
            title="View File"
            onClick={() => setActivePage("history")}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
              <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
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
          <button
            type="button"
            className="icon-btn"
            title="Copy Path"
            onClick={() => {
              navigator.clipboard.writeText(fileHistoryTarget.path).then(() => {
                addToast("Path copied to clipboard", "success");
              });
            }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
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
