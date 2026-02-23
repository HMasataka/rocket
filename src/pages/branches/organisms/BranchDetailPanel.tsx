import type { BranchInfo } from "../../../services/git";
import type { CommitInfo } from "../../../services/history";
import { formatAbsoluteDate, formatRelativeDate } from "../../../utils/date";

interface BranchDetailPanelProps {
  branch: BranchInfo | null;
  commits: CommitInfo[];
  onSwitch: () => void;
  onMerge: () => void;
}

export function BranchDetailPanel({
  branch,
  commits,
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

  const lastCommit = commits[0] ?? null;

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

        <div className="branch-sync-status">
          <div className="sync-item">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z" />
            </svg>
            <span>{branch.ahead_count} ahead</span>
          </div>
          <div className="sync-item">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z" />
            </svg>
            <span>{branch.behind_count} behind</span>
          </div>
        </div>

        {lastCommit && (
          <div className="branch-last-commit">
            <div className="section-label">Last Commit</div>
            <div className="last-commit-card">
              <div className="last-commit-header">
                <div className="last-commit-avatar">
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
                  </svg>
                </div>
                <div className="last-commit-author-info">
                  <div className="last-commit-author">
                    {lastCommit.author_name}
                  </div>
                  <div className="last-commit-email">
                    {lastCommit.author_email}
                  </div>
                </div>
                <div className="last-commit-date">
                  <div className="last-commit-relative">
                    {formatRelativeDate(lastCommit.author_date)}
                  </div>
                  <div className="last-commit-absolute">
                    {formatAbsoluteDate(lastCommit.author_date)}
                  </div>
                </div>
              </div>
              <div className="last-commit-body">
                <div className="last-commit-hash">{lastCommit.short_oid}</div>
                <div className="last-commit-message">{lastCommit.message}</div>
              </div>
            </div>
          </div>
        )}

        {commits.length > 0 && (
          <div className="branch-recent-commits">
            <div className="section-label">Recent Commits</div>
            <div className="branch-commits-list">
              {commits.map((commit) => (
                <div key={commit.oid} className="branch-commit-row">
                  <div className="branch-commit-hash">{commit.short_oid}</div>
                  <div className="branch-commit-message">{commit.message}</div>
                  <div className="branch-commit-meta">
                    <span className="branch-commit-author">
                      {commit.author_name}
                    </span>
                    <span className="branch-commit-date">
                      {formatRelativeDate(commit.author_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
