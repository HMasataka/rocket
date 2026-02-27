import { useCallback, useState } from "react";
import { useCommitLog } from "../../hooks/useCommitLog";
import type { CommitDetail } from "../../services/history";
import { getCommitDetail } from "../../services/history";
import type { ResetMode } from "../../services/reset";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { HardResetDialog } from "./organisms/HardResetDialog";
import { ResetCommitList } from "./organisms/ResetCommitList";
import { ResetOptions } from "./organisms/ResetOptions";
import { ResetPreview } from "./organisms/ResetPreview";

export function ResetPage() {
  const commits = useCommitLog();
  const [selectedOid, setSelectedOid] = useState<string | null>(null);
  const [mode, setMode] = useState<ResetMode>("mixed");
  const [previewDetail, setPreviewDetail] = useState<CommitDetail | null>(null);
  const [executing, setExecuting] = useState(false);
  const [showHardConfirm, setShowHardConfirm] = useState(false);

  const resetToCommit = useGitStore((s) => s.resetToCommit);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const addToast = useUIStore((s) => s.addToast);

  const handleSelect = useCallback(
    (oid: string) => {
      setSelectedOid(oid);
      getCommitDetail(oid)
        .then(setPreviewDetail)
        .catch((e: unknown) => addToast(String(e), "error"));
    },
    [addToast],
  );

  const executeReset = useCallback(async () => {
    if (!selectedOid) return;
    setExecuting(true);
    try {
      await resetToCommit(selectedOid, mode);
      addToast(
        `Reset (${mode}) to ${selectedOid.slice(0, 7)} completed`,
        "success",
      );
      setSelectedOid(null);
      setPreviewDetail(null);
      await fetchStatus();
    } catch (e: unknown) {
      addToast(`Reset failed: ${String(e)}`, "error");
    } finally {
      setExecuting(false);
    }
  }, [selectedOid, mode, resetToCommit, addToast, fetchStatus]);

  const handleExecute = useCallback(() => {
    if (mode === "hard") {
      setShowHardConfirm(true);
    } else {
      executeReset();
    }
  }, [mode, executeReset]);

  const handleHardConfirm = useCallback(() => {
    setShowHardConfirm(false);
    executeReset();
  }, [executeReset]);

  const totalAdd = previewDetail?.stats.additions ?? 0;
  const totalDel = previewDetail?.stats.deletions ?? 0;
  const fileCount = previewDetail?.stats.files_changed ?? 0;

  return (
    <div className="operation-layout">
      <div className="operation-header">
        <div className="operation-info">
          <h2 className="operation-title">Reset</h2>
          <span className="operation-desc">Move HEAD to a previous commit</span>
        </div>
      </div>
      <div className="operation-two-column">
        <div className="operation-left-panel">
          <ResetCommitList
            commits={commits}
            selectedOid={selectedOid}
            onSelect={handleSelect}
          />
          <ResetOptions mode={mode} onModeChange={setMode} />
        </div>
        <div className="operation-right-panel">
          <ResetPreview detail={previewDetail} />
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
          className="btn btn-danger"
          disabled={!selectedOid || executing}
          onClick={handleExecute}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            role="img"
            aria-label="Execute Reset"
          >
            <path d="M2 2v4.5h4.5M2 6.5A6.5 6.5 0 1 1 3.29 10" />
          </svg>
          Execute Reset
        </button>
      </div>
      {showHardConfirm && selectedOid && (
        <HardResetDialog
          commitOid={selectedOid}
          onConfirm={handleHardConfirm}
          onCancel={() => setShowHardConfirm(false)}
        />
      )}
    </div>
  );
}
