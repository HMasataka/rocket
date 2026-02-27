import type { PrDetail } from "../../services/hosting";

interface PrDetailPanelProps {
  detail: PrDetail | null;
  loading: boolean;
  onViewOnGitHub: () => void;
}

function CheckIcon({ status }: { status: string }) {
  if (status === "success") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        role="img"
        aria-label="Success"
      >
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      aria-label="Failure"
    >
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
    </svg>
  );
}

export function PrDetailPanel({
  detail,
  loading,
  onViewOnGitHub,
}: PrDetailPanelProps) {
  if (!detail) {
    return (
      <div className="hosting-detail-panel">
        <div className="hosting-empty">
          {loading ? "Loading..." : "Select a pull request to view details"}
        </div>
      </div>
    );
  }

  const pr = detail.pull_request;

  return (
    <div className="hosting-detail-panel">
      <div className="pr-detail">
        <div className="pr-detail-header">
          <div className="pr-detail-title-row">
            <h3 className="pr-detail-title">{pr.title}</h3>
            <span className={`pr-status-badge ${pr.state.toLowerCase()}`}>
              {pr.state}
            </span>
          </div>
          <div className="pr-detail-meta">
            <span className="pr-detail-number">#{pr.number}</span>
            <span className="pr-detail-branch">
              <span className="branch-from">{pr.head_branch}</span>
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                role="img"
                aria-label="Arrow"
              >
                <path d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z" />
              </svg>
              <span className="branch-to">{pr.base_branch}</span>
            </span>
          </div>
        </div>

        {pr.body && (
          <div className="pr-detail-section">
            <div className="pr-detail-section-title">Description</div>
            <div className="pr-detail-body">
              <p>{pr.body}</p>
            </div>
          </div>
        )}

        {detail.reviewers.length > 0 && (
          <div className="pr-detail-section">
            <div className="pr-detail-section-title">Reviewers</div>
            <div className="reviewer-list">
              {detail.reviewers.map((reviewer) => (
                <div key={reviewer.login} className="reviewer-item">
                  <div className="reviewer-avatar">
                    {reviewer.login[0]?.toUpperCase()}
                  </div>
                  <span className="reviewer-name">{reviewer.login}</span>
                  <span
                    className={`reviewer-status ${reviewer.state.toLowerCase()}`}
                  >
                    {reviewer.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pr.labels.length > 0 && (
          <div className="pr-detail-section">
            <div className="pr-detail-section-title">Labels</div>
            <div className="pr-detail-labels">
              {pr.labels.map((label) => (
                <span key={label.name} className="pr-label">
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {detail.checks.length > 0 && (
          <div className="pr-detail-section">
            <div className="pr-detail-section-title">Checks</div>
            <div className="checks-list">
              {detail.checks.map((check) => (
                <div key={check.name} className={`check-item ${check.status}`}>
                  <span className="check-icon">
                    <CheckIcon status={check.status} />
                  </span>
                  <span className="check-name">{check.name}</span>
                  <span className="check-desc">{check.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pr-detail-section">
          <div className="pr-detail-section-title">Changes</div>
          <div className="pr-changes-summary">
            <span className="pr-changes-stat">
              <strong>{pr.changed_files}</strong> files changed
            </span>
            <span className="pr-changes-add">+{pr.additions}</span>
            <span className="pr-changes-del">-{pr.deletions}</span>
          </div>
        </div>
      </div>

      <div className="operation-footer">
        <div className="hosting-footer-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onViewOnGitHub}
          >
            View on GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
