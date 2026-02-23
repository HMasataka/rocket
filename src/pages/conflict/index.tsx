import { useCallback, useEffect, useState } from "react";
import type { ConflictResolution } from "../../services/conflict";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { ConflictDetail } from "./organisms/ConflictDetail";
import { ConflictFileList } from "./organisms/ConflictFileList";
import { MergeViewerModal } from "./organisms/MergeViewerModal";

export function ConflictModal() {
  const conflictFiles = useGitStore((s) => s.conflictFiles);
  const fetchConflictFiles = useGitStore((s) => s.fetchConflictFiles);
  const resolveConflict = useGitStore((s) => s.resolveConflict);
  const resolveConflictBlock = useGitStore((s) => s.resolveConflictBlock);
  const markResolved = useGitStore((s) => s.markResolved);
  const abortMerge = useGitStore((s) => s.abortMerge);
  const continueMerge = useGitStore((s) => s.continueMerge);
  const rebasing = useGitStore((s) => s.rebasing);
  const abortRebase = useGitStore((s) => s.abortRebase);
  const continueRebase = useGitStore((s) => s.continueRebase);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const addToast = useUIStore((s) => s.addToast);
  const closeModal = useUIStore((s) => s.closeModal);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [resolvedPaths, setResolvedPaths] = useState<Set<string>>(new Set());
  const [initialPaths, setInitialPaths] = useState<string[]>([]);
  const [mergeViewerPath, setMergeViewerPath] = useState<string | null>(null);

  useEffect(() => {
    fetchConflictFiles().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchConflictFiles, addToast]);

  useEffect(() => {
    if (initialPaths.length === 0 && conflictFiles.length > 0) {
      setInitialPaths(conflictFiles.map((f) => f.path));
    }
  }, [conflictFiles, initialPaths.length]);

  useEffect(() => {
    if (selectedPath) return;
    const first = conflictFiles.find((f) => !resolvedPaths.has(f.path));
    if (first) {
      setSelectedPath(first.path);
    }
  }, [conflictFiles, selectedPath, resolvedPaths]);

  const selectedFile =
    conflictFiles.find((f) => f.path === selectedPath) ?? null;
  const resolvedCount = resolvedPaths.size;
  const totalCount = initialPaths.length;
  const allResolved = totalCount > 0 && resolvedCount === totalCount;

  const refreshConflicts = useCallback(async () => {
    await fetchConflictFiles();
  }, [fetchConflictFiles]);

  const handleResolveBlock = useCallback(
    async (blockIndex: number, resolution: ConflictResolution) => {
      if (!selectedPath) return;
      try {
        await resolveConflictBlock(selectedPath, blockIndex, resolution);
        await refreshConflicts();
        addToast(`Block ${blockIndex + 1} resolved`, "success");
      } catch (e: unknown) {
        addToast(String(e), "error");
      }
    },
    [selectedPath, resolveConflictBlock, refreshConflicts, addToast],
  );

  const handleResolveFile = useCallback(
    async (resolution: ConflictResolution) => {
      if (!selectedPath) return;
      try {
        await resolveConflict(selectedPath, resolution);
        await refreshConflicts();
        addToast(`File resolved: ${selectedPath}`, "success");
      } catch (e: unknown) {
        addToast(String(e), "error");
      }
    },
    [selectedPath, resolveConflict, refreshConflicts, addToast],
  );

  const handleMarkResolved = useCallback(async () => {
    if (!selectedPath) return;
    try {
      await markResolved(selectedPath);
      setResolvedPaths((prev) => new Set([...prev, selectedPath]));
      await refreshConflicts();
      addToast(`Marked as resolved: ${selectedPath}`, "success");
    } catch (e: unknown) {
      addToast(String(e), "error");
    }
  }, [selectedPath, markResolved, refreshConflicts, addToast]);

  const handleAbort = useCallback(async () => {
    try {
      if (rebasing) {
        await abortRebase();
        addToast("Rebase aborted", "success");
      } else {
        await abortMerge();
        addToast("Merge aborted", "success");
      }
      await fetchStatus();
      closeModal();
    } catch (e: unknown) {
      addToast(String(e), "error");
    }
  }, [rebasing, abortRebase, abortMerge, fetchStatus, addToast, closeModal]);

  const handleContinue = useCallback(async () => {
    try {
      if (rebasing) {
        const result = await continueRebase();
        if (result.completed) {
          addToast("Rebase completed", "success");
          closeModal();
        } else {
          addToast("Rebase has more conflicts", "warning");
          await refreshConflicts();
        }
      } else {
        await continueMerge("");
        addToast("Merge completed", "success");
        closeModal();
      }
      await fetchStatus();
    } catch (e: unknown) {
      addToast(String(e), "error");
    }
  }, [
    rebasing,
    continueRebase,
    continueMerge,
    fetchStatus,
    refreshConflicts,
    addToast,
    closeModal,
  ]);

  const handleMergeViewerApply = useCallback(
    async (content: string) => {
      if (!mergeViewerPath) return;
      try {
        await resolveConflict(mergeViewerPath, {
          type: "Manual",
          content,
        });
        await refreshConflicts();
        addToast(`Applied merge result: ${mergeViewerPath}`, "success");
      } catch (e: unknown) {
        addToast(String(e), "error");
      }
      setMergeViewerPath(null);
    },
    [mergeViewerPath, resolveConflict, refreshConflicts, addToast],
  );

  const progressPercent =
    totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: overlay dismiss is mouse-only */}
      <div
        className="modal-overlay active"
        onClick={handleAbort}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleAbort();
        }}
      />
      <div className="modal conflict-modal active">
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-title">Resolve Conflict</span>
          </div>
          <div className="modal-header-right">
            <span className="conflict-progress">
              <span className="conflict-progress-resolved">
                {resolvedCount}
              </span>
              <span className="conflict-progress-sep">/</span>
              <span className="conflict-progress-total">{totalCount}</span>
              <span className="conflict-progress-label">resolved</span>
            </span>
            <button type="button" className="modal-close" onClick={handleAbort}>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="conflict-progress-bar">
          <div
            className="conflict-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="modal-body conflict-body">
          <ConflictFileList
            files={conflictFiles}
            selectedPath={selectedPath}
            resolvedPaths={resolvedPaths}
            onSelectFile={setSelectedPath}
          />
          {selectedFile && (
            <ConflictDetail
              file={selectedFile}
              isResolved={resolvedPaths.has(selectedFile.path)}
              onResolveBlock={handleResolveBlock}
              onResolveFile={handleResolveFile}
              onMarkResolved={handleMarkResolved}
              onOpenMergeViewer={() => setMergeViewerPath(selectedFile.path)}
            />
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={handleAbort}
          >
            {rebasing ? "Abort Rebase" : "Abort Merge"}
          </button>
          <div className="modal-footer-spacer" />
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allResolved}
            onClick={handleContinue}
          >
            {rebasing ? "Continue Rebase" : "Continue Merge"}
          </button>
        </div>
      </div>
      {mergeViewerPath && (
        <MergeViewerModal
          path={mergeViewerPath}
          onApply={handleMergeViewerApply}
        />
      )}
    </>
  );
}
