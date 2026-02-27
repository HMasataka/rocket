import { Button } from "../../../components/atoms/Button";
import type { FileStatus, StagingState } from "../../../services/git";
import { useAiStore } from "../../../stores/aiStore";
import { FileSection } from "../molecules/FileSection";

interface FilePanelProps {
  files: FileStatus[];
  selectedFile: string | null;
  selectedFileStaged: boolean;
  onSelectFile: (path: string, staged: boolean) => void;
  onFileAction: (path: string, staging: StagingState) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
}

export function FilePanel({
  files,
  selectedFile,
  selectedFileStaged,
  onSelectFile,
  onFileAction,
  onStageAll,
  onUnstageAll,
}: FilePanelProps) {
  const reviewComments = useAiStore((s) => s.reviewComments);

  const staged = files.filter((f) => f.staging === "staged");
  const modified = files.filter(
    (f) => f.staging === "unstaged" && f.kind !== "untracked",
  );
  const untracked = files.filter(
    (f) => f.staging === "unstaged" && f.kind === "untracked",
  );

  return (
    <div className="file-panel">
      <div className="panel-header">
        <span className="panel-title">Changed Files</span>
        <div className="panel-actions">
          <Button variant="secondary" size="xs" onClick={onUnstageAll}>
            Unstage All
          </Button>
          <Button variant="secondary" size="xs" onClick={onStageAll}>
            Stage All
          </Button>
        </div>
      </div>
      <FileSection
        title="Staged"
        files={staged}
        selectedFile={selectedFile}
        selectedFileStaged={selectedFileStaged}
        reviewComments={reviewComments}
        onSelectFile={onSelectFile}
        onFileAction={onFileAction}
      />
      <FileSection
        title="Modified"
        files={modified}
        selectedFile={selectedFile}
        selectedFileStaged={selectedFileStaged}
        reviewComments={reviewComments}
        onSelectFile={onSelectFile}
        onFileAction={onFileAction}
      />
      <FileSection
        title="Untracked"
        files={untracked}
        selectedFile={selectedFile}
        selectedFileStaged={selectedFileStaged}
        reviewComments={reviewComments}
        onSelectFile={onSelectFile}
        onFileAction={onFileAction}
      />
    </div>
  );
}
