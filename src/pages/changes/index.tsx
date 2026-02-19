import { useCallback, useEffect } from "react";
import type { StagingState } from "../../services/git";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { FilePanel } from "./organisms/FilePanel";
import { DiffPanel } from "./organisms/DiffPanel";
import { CommitPanel } from "./organisms/CommitPanel";

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

  const selectedFile = useUIStore((s) => s.selectedFile);
  const selectedFileStaged = useUIStore((s) => s.selectedFileStaged);
  const selectFile = useUIStore((s) => s.selectFile);
  const addToast = useUIStore((s) => s.addToast);

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
    async (message: string) => {
      try {
        await commitAction(message);
        addToast("Commit created successfully", "success");
        await fetchStatus();
      } catch (e: unknown) {
        addToast(`Commit failed: ${String(e)}`, "error");
      }
    },
    [commitAction, fetchStatus, addToast],
  );

  const files = status?.files ?? [];
  const hasStagedFiles = files.some((f) => f.staging === "staged");

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
      <DiffPanel selectedFile={selectedFile} diffs={diff} />
      <CommitPanel onCommit={handleCommit} hasStagedFiles={hasStagedFiles} />
    </div>
  );
}
