import type { PullRequest } from "../../services/hosting";

interface PrListProps {
  pullRequests: PullRequest[];
  selectedNumber: number | null;
  onSelect: (number: number) => void;
}

export function PrList({
  pullRequests,
  selectedNumber,
  onSelect,
}: PrListProps) {
  return (
    <div className="hosting-list-panel">
      {pullRequests.map((pr) => (
        <button
          key={pr.number}
          type="button"
          className={`pr-item${selectedNumber === pr.number ? " selected" : ""}`}
          onClick={() => onSelect(pr.number)}
        >
          <div
            className={`pr-status-icon ${pr.draft ? "draft" : pr.state.toLowerCase()}`}
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              role="img"
              aria-label="Pull request"
            >
              <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354Z" />
            </svg>
          </div>
          <div className="pr-info">
            <div className="pr-title-row">
              <span className="pr-title">{pr.title}</span>
              {pr.draft && <span className="pr-draft-badge">Draft</span>}
            </div>
            <div className="pr-meta">
              <span className="pr-number">#{pr.number}</span>
              <span className="pr-author">{pr.author}</span>
              <span className="pr-date">{pr.updated_at}</span>
            </div>
          </div>
          {pr.labels.length > 0 && (
            <div className="pr-labels">
              {pr.labels.map((label) => (
                <span key={label.name} className="pr-label">
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </button>
      ))}
      {pullRequests.length === 0 && (
        <div className="hosting-empty">No pull requests found</div>
      )}
    </div>
  );
}
