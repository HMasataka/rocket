import type { BranchInfo } from "../../../services/git";

interface BranchDetailPanelProps {
  branch: BranchInfo | null;
  onSwitch: () => void;
  onMerge: () => void;
}

export function BranchDetailPanel({
  branch,
  onSwitch,
  onMerge,
}: BranchDetailPanelProps) {
  if (!branch) {
    return (
      <div className="branch-detail-panel">
        <div className="branch-detail-content">
          <p className="page-desc">Select a branch to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="branch-detail-panel">
      <div className="branch-detail-content">
        <div className="branch-detail-header">
          <div
            className={`branch-detail-icon${branch.is_head ? " current" : ""}`}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z" />
            </svg>
          </div>
          <div className="branch-detail-info">
            <div className="branch-detail-name">{branch.name}</div>
            <div className="branch-detail-tracking">
              {branch.is_remote
                ? (branch.remote_name ?? "Remote")
                : (branch.upstream ?? "Local only")}
            </div>
          </div>
          {branch.is_head && <span className="current-badge">HEAD</span>}
          <div className="branch-detail-actions">
            {!branch.is_head && !branch.is_remote && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onSwitch}
              >
                Switch
              </button>
            )}
            {!branch.is_head && !branch.is_remote && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onMerge}
              >
                Merge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
