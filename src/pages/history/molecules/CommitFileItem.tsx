import type { CommitFileChange } from "../../../services/history";

interface CommitFileItemProps {
  file: CommitFileChange;
  isExpanded: boolean;
  onToggle: (path: string) => void;
}

function statusLabel(status: CommitFileChange["status"]): string {
  switch (status) {
    case "added":
      return "+";
    case "deleted":
      return "-";
    case "modified":
      return "~";
    case "renamed":
      return "R";
    default:
      return "?";
  }
}

function statusClass(status: CommitFileChange["status"]): string {
  switch (status) {
    case "added":
      return "unified-file-status added";
    case "deleted":
      return "unified-file-status deleted";
    case "modified":
      return "unified-file-status modified";
    default:
      return "unified-file-status modified";
  }
}

export function CommitFileItem({
  file,
  isExpanded,
  onToggle,
}: CommitFileItemProps) {
  return (
    <button
      type="button"
      className={`unified-file${isExpanded ? " expanded" : ""}`}
      onClick={() => onToggle(file.path)}
    >
      <div className={statusClass(file.status)}>{statusLabel(file.status)}</div>
      <div className="unified-file-path">{file.path}</div>
      <div className="unified-file-stats">
        <span className="stat-add">+{file.additions}</span>
        <span className="stat-del">-{file.deletions}</span>
      </div>
      <div className="unified-file-expand">
        <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
          <path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
        </svg>
      </div>
    </button>
  );
}
