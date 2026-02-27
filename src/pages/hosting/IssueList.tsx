import type { Issue } from "../../services/hosting";

interface IssueListProps {
  issues: Issue[];
}

export function IssueList({ issues }: IssueListProps) {
  return (
    <div className="hosting-list-panel" style={{ gridColumn: "1 / -1" }}>
      {issues.map((issue) => (
        <div key={issue.number} className="pr-item">
          <div className={`pr-status-icon ${issue.state.toLowerCase()}`}>
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              role="img"
              aria-label="Issue"
            >
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
            </svg>
          </div>
          <div className="pr-info">
            <div className="pr-title-row">
              <span className="pr-title">{issue.title}</span>
            </div>
            <div className="pr-meta">
              <span className="pr-number">#{issue.number}</span>
              <span className="pr-author">{issue.author}</span>
              <span className="pr-date">{issue.created_at}</span>
            </div>
          </div>
          {issue.labels.length > 0 && (
            <div className="pr-labels">
              {issue.labels.map((label) => (
                <span key={label.name} className="pr-label">
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
      {issues.length === 0 && (
        <div className="hosting-empty">No issues found</div>
      )}
    </div>
  );
}
