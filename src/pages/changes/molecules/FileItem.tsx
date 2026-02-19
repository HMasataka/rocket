import { StatusBadge } from "../../../components/atoms/StatusBadge";
import type { FileStatus, StagingState } from "../../../services/git";

interface FileItemProps {
  file: FileStatus;
  selected: boolean;
  onSelect: (path: string, staged: boolean) => void;
  onAction: (path: string, staging: StagingState) => void;
}

export function FileItem({
  file,
  selected,
  onSelect,
  onAction,
}: FileItemProps) {
  const isStaged = file.staging === "staged";
  const actionTitle = isStaged ? "Unstage" : "Stage";
  const actionLabel = isStaged ? "\u2212" : "+";

  return (
    // biome-ignore lint/a11y/useSemanticElements: contains nested button for stage/unstage action
    <div
      className={`file-item${selected ? " selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(file.path, isStaged)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(file.path, isStaged);
        }
      }}
    >
      <StatusBadge kind={file.kind} />
      <span className="file-name">{file.path}</span>
      <button
        type="button"
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
