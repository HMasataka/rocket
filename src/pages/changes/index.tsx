import { useCallback, useEffect } from "react";
import type { HunkIdentifier, StagingState } from "../../services/git";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { CommitPanel } from "./organisms/CommitPanel";
import { DiffPanel } from "./organisms/DiffPanel";
import { FilePanel } from "./organisms/FilePanel";
import { toHunkIdentifier } from "./utils/diffUtils";

export function ChangesPage() {
  const status = useGitStore((s) => s.status);
  const diff = useGitStore((s) => s.diff);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const fetchDiff = useGitStore((s) => s.fetchDiff);
  const stageFile = useGitStore((s) => s.stageFile);
  const unstageFile = useGitStore((s) => s.unstageFile);
  const stageAllAction = useGitStore((s) => s.stageAll);
  const unstageAllAction = useGitStore((s) => s.unstageAll);
  const commitAction = useGitStore((s) => s.commit);
  const stageHunkAction = useGitStore((s) => s.stageHunk);
  const unstageHunkAction = useGitStore((s) => s.unstageHunk);
  const discardHunkAction = useGitStore((s) => s.discardHunk);
  const stageLinesAction = useGitStore((s) => s.stageLines);
  const unstageLinesAction = useGitStore((s) => s.unstageLines);
  const discardLinesAction = useGitStore((s) => s.discardLines);
  const getHeadCommitMessage = useGitStore((s) => s.getHeadCommitMessage);

  const selectedFile = useUIStore((s) => s.selectedFile);
  const selectedFileStaged = useUIStore((s) => s.selectedFileStaged);
  const selectFile = useUIStore((s) => s.selectFile);
  const addToast = useUIStore((s) => s.addToast);
  const diffViewMode = useUIStore((s) => s.diffViewMode);
  const setDiffViewMode = useUIStore((s) => s.setDiffViewMode);

  useEffect(() => {
    fetchStatus().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchStatus, addToast]);

  useEffect(() => {
    if (selectedFile) {
      fetchDiff(selectedFile, selectedFileStaged).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    }
  }, [selectedFile, selectedFileStaged, fetchDiff, addToast]);

  const handleSelectFile = useCallback(
    (path: string, staged: boolean) => {
      selectFile(path, staged);
    },
    [selectFile],
  );

  const handleFileAction = useCallback(
    async (path: string, staging: StagingState) => {
      if (staging === "staged") {
        await unstageFile(path);
      } else {
        await stageFile(path);
      }
      await fetchStatus();
    },
    [stageFile, unstageFile, fetchStatus],
  );

  const handleStageAll = useCallback(async () => {
    await stageAllAction();
    await fetchStatus();
  }, [stageAllAction, fetchStatus]);

  const handleUnstageAll = useCallback(async () => {
    await unstageAllAction();
    await fetchStatus();
  }, [unstageAllAction, fetchStatus]);

  const handleCommit = useCallback(
    async (message: string, amend: boolean) => {
      try {
        await commitAction(message, amend);
        addToast(
          amend ? "Commit amended successfully" : "Commit created successfully",
          "success",
        );
        await fetchStatus();
      } catch (e: unknown) {
        addToast(`Commit failed: ${String(e)}`, "error");
      }
    },
    [commitAction, fetchStatus, addToast],
  );

  const handleStageHunk = useCallback(
    async (hunk: HunkIdentifier) => {
      if (!selectedFile) return;
      if (selectedFileStaged) {
        await unstageHunkAction(selectedFile, hunk);
      } else {
        await stageHunkAction(selectedFile, hunk);
      }
      await fetchStatus();
      await fetchDiff(selectedFile, selectedFileStaged);
    },
    [
      selectedFile,
      selectedFileStaged,
      stageHunkAction,
      unstageHunkAction,
      fetchStatus,
      fetchDiff,
    ],
  );

  const handleDiscardHunk = useCallback(
    async (hunk: HunkIdentifier) => {
      if (!selectedFile) return;
      await discardHunkAction(selectedFile, hunk);
      await fetchStatus();
      await fetchDiff(selectedFile, selectedFileStaged);
    },
    [
      selectedFile,
      selectedFileStaged,
      discardHunkAction,
      fetchStatus,
      fetchDiff,
    ],
  );

  const findHunkByGlobalIndex = useCallback(
    (hunkIndex: number) => {
      let idx = 0;
      for (const fileDiff of diff) {
        for (const hunk of fileDiff.hunks) {
          if (idx === hunkIndex) {
            return toHunkIdentifier(hunk);
          }
          idx++;
        }
      }
      return null;
    },
    [diff],
  );

  const handleStageLines = useCallback(
    async (hunkIndex: number, lineIndices: number[]) => {
      if (!selectedFile) return;
      const hunkId = findHunkByGlobalIndex(hunkIndex);
      if (!hunkId) return;
      const lineRange = { hunk: hunkId, line_indices: lineIndices };
      if (selectedFileStaged) {
        await unstageLinesAction(selectedFile, lineRange);
      } else {
        await stageLinesAction(selectedFile, lineRange);
      }
      await fetchStatus();
      await fetchDiff(selectedFile, selectedFileStaged);
    },
    [
      selectedFile,
      selectedFileStaged,
      findHunkByGlobalIndex,
      stageLinesAction,
      unstageLinesAction,
      fetchStatus,
      fetchDiff,
    ],
  );

  const handleDiscardLines = useCallback(
    async (hunkIndex: number, lineIndices: number[]) => {
      if (!selectedFile) return;
      const hunkId = findHunkByGlobalIndex(hunkIndex);
      if (!hunkId) return;
      const lineRange = { hunk: hunkId, line_indices: lineIndices };
      await discardLinesAction(selectedFile, lineRange);
      await fetchStatus();
      await fetchDiff(selectedFile, selectedFileStaged);
    },
    [
      selectedFile,
      selectedFileStaged,
      findHunkByGlobalIndex,
      discardLinesAction,
      fetchStatus,
      fetchDiff,
    ],
  );

  const files = status?.files ?? [];
  const hasStagedFiles = files.some((f) => f.staging === "staged");
  const hasChanges = files.length > 0;

  return (
    <div className="changes-layout">
      <FilePanel
        files={files}
        selectedFile={selectedFile}
        selectedFileStaged={selectedFileStaged}
        onSelectFile={handleSelectFile}
        onFileAction={handleFileAction}
        onStageAll={handleStageAll}
        onUnstageAll={handleUnstageAll}
      />
      <DiffPanel
        selectedFile={selectedFile}
        diffs={diff}
        staged={selectedFileStaged}
        diffViewMode={diffViewMode}
        onSetDiffViewMode={setDiffViewMode}
        onStageHunk={handleStageHunk}
        onDiscardHunk={handleDiscardHunk}
        onStageLines={handleStageLines}
        onDiscardLines={handleDiscardLines}
      />
      <CommitPanel
        onCommit={handleCommit}
        hasStagedFiles={hasStagedFiles}
        hasChanges={hasChanges}
        onLoadHeadMessage={getHeadCommitMessage}
      />
    </div>
  );
}
