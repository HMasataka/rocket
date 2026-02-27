import { useCallback, useEffect, useState } from "react";
import type { CherryPickMode } from "../../services/cherryPick";
import { getBranchCommits } from "../../services/git";
import type { CommitDetail, CommitInfo } from "../../services/history";
import { getCommitDetail } from "../../services/history";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import "../../styles/cherry-pick.css";
import { CherryPickCommitList } from "./organisms/CherryPickCommitList";
import { CherryPickOptions } from "./organisms/CherryPickOptions";
import { CherryPickPreview } from "./organisms/CherryPickPreview";

export function CherryPickPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [selectedOids, setSelectedOids] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<CherryPickMode>("normal");
  const [previewDetail, setPreviewDetail] = useState<CommitDetail | null>(null);
  const [executing, setExecuting] = useState(false);

  const branches = useGitStore((s) => s.branches);
  const currentBranch = useGitStore((s) => s.currentBranch);
  const fetchBranches = useGitStore((s) => s.fetchBranches);
  const cherryPick = useGitStore((s) => s.cherryPick);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const addToast = useUIStore((s) => s.addToast);
  const openModal = useUIStore((s) => s.openModal);

  useEffect(() => {
    fetchBranches().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchBranches, addToast]);

  const availableBranches = branches.filter(
    (b) => b.name !== currentBranch && !b.is_remote,
  );

  const handleSelectBranch = useCallback(
    async (branch: string) => {
      setSelectedBranch(branch);
      setSelectedOids(new Set());
      setPreviewDetail(null);
      if (!branch) {
        setCommits([]);
        return;
      }
      try {
        const result = await getBranchCommits(branch, 100);
        setCommits(result);
      } catch (e: unknown) {
        addToast(String(e), "error");
        setCommits([]);
      }
    },
    [addToast],
  );

  const handleToggle = useCallback(
    (oid: string) => {
      setSelectedOids((prev) => {
        const next = new Set(prev);
        if (next.has(oid)) {
          next.delete(oid);
        } else {
          next.add(oid);
        }
        return next;
      });

      getCommitDetail(oid)
        .then(setPreviewDetail)
        .catch((e: unknown) => addToast(String(e), "error"));
    },
    [addToast],
  );

  const handleExecute = useCallback(async () => {
    if (selectedOids.size === 0) return;
    setExecuting(true);
    try {
      const oids = commits
        .filter((c) => selectedOids.has(c.oid))
        .map((c) => c.oid);
      const result = await cherryPick(oids, mode);
      if (result.completed) {
        addToast(`Cherry-pick completed: ${oids.length} commit(s)`, "success");
        setSelectedOids(new Set());
        setPreviewDetail(null);
        await fetchStatus();
      } else {
        addToast(
          `Cherry-pick has conflicts in ${result.conflicts.length} file(s)`,
          "warning",
        );
        openModal("conflict");
      }
    } catch (e: unknown) {
      addToast(`Cherry-pick failed: ${String(e)}`, "error");
    } finally {
      setExecuting(false);
    }
  }, [
    selectedOids,
    commits,
    mode,
    cherryPick,
    addToast,
    fetchStatus,
    openModal,
  ]);

  const selectedCount = selectedOids.size;
  const totalAdd = previewDetail?.stats.additions ?? 0;
  const totalDel = previewDetail?.stats.deletions ?? 0;
  const fileCount = previewDetail?.stats.files_changed ?? 0;

  return (
    <div className="operation-layout">
      <div className="operation-header">
        <div className="operation-info">
          <h2 className="operation-title">Cherry-pick</h2>
          <span className="operation-desc">
            Apply specific commits to the current branch
          </span>
        </div>
      </div>
      <div className="cherry-branch-selector">
        <label htmlFor="cherry-pick-branch">Source branch:</label>
        <select
          id="cherry-pick-branch"
          value={selectedBranch}
          onChange={(e) => handleSelectBranch(e.target.value)}
        >
          <option value="">Select a branch...</option>
          {availableBranches.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="operation-two-column">
        <div className="operation-left-panel">
          <CherryPickCommitList
            commits={commits}
            selectedOids={selectedOids}
            onToggle={handleToggle}
          />
          <CherryPickOptions mode={mode} onModeChange={setMode} />
        </div>
        <div className="operation-right-panel">
          <CherryPickPreview detail={previewDetail} />
        </div>
      </div>
      <div className="operation-footer">
        <div className="operation-summary">
          <span className="summary-stat">
            <strong>{selectedCount}</strong> commit(s) selected
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
          className="btn btn-primary"
          disabled={selectedCount === 0 || executing}
          onClick={handleExecute}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            role="img"
            aria-label="Execute Cherry-pick"
          >
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
          Execute Cherry-pick
        </button>
      </div>
    </div>
  );
}
