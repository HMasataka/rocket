import type { FileStatus, StagingState } from "../../../services/git";
import { StatusBadge } from "../../../components/atoms/StatusBadge";

interface FileItemProps {
  file: FileStatus;
  selected: boolean;
  onSelect: (path: string, staged: boolean) => void;
  onAction: (path: string, staging: StagingState) => void;
}

export function FileItem({ file, selected, onSelect, onAction }: FileItemProps) {
  const isStaged = file.staging === "staged";
  const actionTitle = isStaged ? "Unstage" : "Stage";
  const actionLabel = isStaged ? "\u2212" : "+";

  return (
    <div
      className={`file-item${selected ? " selected" : ""}`}
      onClick={() => onSelect(file.path, isStaged)}
    >
      <StatusBadge kind={file.kind} />
      <span className="file-name">{file.path}</span>
      <button
        className="file-action"
        title={actionTitle}
        onClick={(e) => {
          e.stopPropagation();
          onAction(file.path, file.staging);
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
