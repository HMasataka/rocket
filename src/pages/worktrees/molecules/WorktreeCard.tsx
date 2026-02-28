import type { WorktreeInfo } from "../../../services/worktree";

interface WorktreeCardProps {
  worktree: WorktreeInfo;
  onRemove: (path: string) => void;
}

export function WorktreeCard({ worktree, onRemove }: WorktreeCardProps) {
  return (
    <div
      className={`worktree-card ${worktree.is_main ? "main" : ""} ${worktree.is_clean ? "clean" : "modified"}`}
    >
      <div className="worktree-header">
        <div className={`worktree-icon ${worktree.is_main ? "main" : ""}`}>
          {worktree.is_main ? (
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146z" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-10z" />
            </svg>
          )}
        </div>
        <div className="worktree-info">
          <div className="worktree-path">{worktree.path}</div>
          {worktree.branch && (
            <div className="worktree-branch">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z" />
              </svg>
              {worktree.branch}
            </div>
          )}
        </div>
        <div className="worktree-badges">
          {worktree.is_main && (
            <span className="worktree-badge main">Main</span>
          )}
          <span
            className={`worktree-badge ${worktree.is_clean ? "clean" : "modified"}`}
          >
            {worktree.is_clean ? "\u2713 Clean" : "\u25CF Modified"}
          </span>
        </div>
      </div>
      {worktree.head_short_oid && (
        <div className="worktree-details">
          <div className="worktree-detail">
            <span className="detail-label">Commit:</span>
            <span className="detail-value hash">{worktree.head_short_oid}</span>
          </div>
        </div>
      )}
      {!worktree.is_main && (
        <div className="worktree-actions">
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
            onClick={() => onRemove(worktree.path)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
