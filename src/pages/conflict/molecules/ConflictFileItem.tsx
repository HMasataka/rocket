import type { ConflictFile } from "../../../services/conflict";

interface ConflictFileItemProps {
  file: ConflictFile;
  isSelected: boolean;
  isResolved: boolean;
  onSelect: (path: string) => void;
}

export function ConflictFileItem({
  file,
  isSelected,
  isResolved,
  onSelect,
}: ConflictFileItemProps) {
  const className = [
    "conflict-file-item",
    isSelected ? "selected" : "",
    isResolved ? "resolved" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(file.path)}
    >
      <span
        className={`conflict-file-status${isResolved ? "" : " unresolved"}`}
      >
        {isResolved ? (
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
          </svg>
        )}
      </span>
      <span className="conflict-file-name">{file.path}</span>
      <span className="conflict-file-count">
        {file.conflict_count} conflict{file.conflict_count !== 1 ? "s" : ""}
      </span>
    </button>
  );
}
