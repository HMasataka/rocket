import type { SubmoduleInfo } from "../../../services/submodule";

interface SubmoduleCardProps {
  submodule: SubmoduleInfo;
  onUpdate: (path: string) => void;
  onRemove: (path: string) => void;
}

function statusLabel(status: SubmoduleInfo["status"]): string {
  switch (status) {
    case "up_to_date":
      return "\u2713 Up to date";
    case "modified":
      return "\u26A0 Updates available";
    case "uninitialized":
      return "Uninitialized";
    case "conflict":
      return "\u2716 Conflict";
  }
}

function statusClass(status: SubmoduleInfo["status"]): string {
  switch (status) {
    case "up_to_date":
      return "up-to-date";
    case "modified":
      return "behind";
    case "uninitialized":
      return "uninitialized";
    case "conflict":
      return "conflict";
  }
}

export function SubmoduleCard({
  submodule,
  onUpdate,
  onRemove,
}: SubmoduleCardProps) {
  return (
    <div
      className={`submodule-card ${submodule.status === "modified" ? "behind" : ""}`}
    >
      <div className="submodule-header">
        <div className="submodule-icon">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8.5 1a.5.5 0 0 1 .5.5v.5h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2v-.5a.5.5 0 0 1 .5-.5zM5 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5z" />
            <path d="M6 7a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 7zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9z" />
          </svg>
        </div>
        <div className="submodule-info">
          <div className="submodule-path">{submodule.path}</div>
          <div className="submodule-url">{submodule.url}</div>
        </div>
        <div className={`submodule-status ${statusClass(submodule.status)}`}>
          {statusLabel(submodule.status)}
        </div>
      </div>
      <div className="submodule-details">
        {submodule.branch && (
          <div className="submodule-detail">
            <span className="detail-label">Branch:</span>
            <span className="detail-value">{submodule.branch}</span>
          </div>
        )}
        {submodule.head_short_oid && (
          <div className="submodule-detail">
            <span className="detail-label">Commit:</span>
            <span className="detail-value hash">
              {submodule.head_short_oid}
            </span>
          </div>
        )}
      </div>
      <div className="submodule-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onUpdate(submodule.path)}
        >
          Update
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled
          title="Open in new tab (coming soon)"
        >
          Open
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onRemove(submodule.path)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
