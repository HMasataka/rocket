import { useCallback, useState } from "react";
import { useCommitLog } from "../../hooks/useCommitLog";
import type { CommitDetail } from "../../services/history";
import { getCommitDetail } from "../../services/history";
import type { RevertMode } from "../../services/revert";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { RevertCommitList } from "./organisms/RevertCommitList";
import { RevertOptions } from "./organisms/RevertOptions";
import { RevertPreview } from "./organisms/RevertPreview";

export function RevertPage() {
  const commits = useCommitLog();
  const [selectedOid, setSelectedOid] = useState<string | null>(null);
  const [mode, setMode] = useState<RevertMode>("auto");
  const [previewDetail, setPreviewDetail] = useState<CommitDetail | null>(null);
  const [executing, setExecuting] = useState(false);

  const revertCommit = useGitStore((s) => s.revertCommit);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const addToast = useUIStore((s) => s.addToast);
  const openModal = useUIStore((s) => s.openModal);

  const handleSelect = useCallback(
    (oid: string) => {
      setSelectedOid(oid);
      getCommitDetail(oid)
        .then(setPreviewDetail)
        .catch((e: unknown) => addToast(String(e), "error"));
    },
    [addToast],
  );

  const handleExecute = useCallback(async () => {
    if (!selectedOid) return;
    setExecuting(true);
    try {
      const result = await revertCommit(selectedOid, mode);
      if (result.completed) {
        addToast("Revert completed successfully", "success");
        setSelectedOid(null);
        setPreviewDetail(null);
        await fetchStatus();
      } else {
        addToast(
          `Revert has conflicts in ${result.conflicts.length} file(s)`,
          "warning",
        );
        openModal("conflict");
      }
    } catch (e: unknown) {
      addToast(`Revert failed: ${String(e)}`, "error");
    } finally {
      setExecuting(false);
    }
  }, [selectedOid, mode, revertCommit, addToast, fetchStatus, openModal]);

  const totalAdd = previewDetail?.stats.additions ?? 0;
  const totalDel = previewDetail?.stats.deletions ?? 0;
  const fileCount = previewDetail?.stats.files_changed ?? 0;

  return (
    <div className="operation-layout">
      <div className="operation-header">
        <div className="operation-info">
          <h2 className="operation-title">Revert</h2>
          <span className="operation-desc">
            Create a new commit that undoes changes
          </span>
        </div>
      </div>
      <div className="operation-two-column">
        <div className="operation-left-panel">
          <RevertCommitList
            commits={commits}
            selectedOid={selectedOid}
            onSelect={handleSelect}
          />
          <RevertOptions mode={mode} onModeChange={setMode} />
        </div>
        <div className="operation-right-panel">
          <RevertPreview detail={previewDetail} />
        </div>
      </div>
      <div className="operation-footer">
        <div className="operation-summary">
          <span className="summary-stat">
            <strong>{selectedOid ? 1 : 0}</strong> commit selected
          </span>
          {previewDetail && (
            <>
              <span className="summary-divider" />
              <span className="summary-stat additions">+{totalAdd}</span>
              <span className="summary-stat deletions">-{totalDel}</span>
              <span className="summary-divider" />
              <span className="summary-stat">{fileCount} files</span>
            </>
          )}
        </div>
        <button
          type="button"
          className="btn btn-warning"
          disabled={!selectedOid || executing}
          onClick={handleExecute}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            role="img"
            aria-label="Execute Revert"
          >
            <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z" />
            <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z" />
          </svg>
          Execute Revert
        </button>
      </div>
    </div>
  );
}
