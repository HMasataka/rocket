import type { BranchInfo } from "../../../services/git";

interface BranchRowProps {
  branch: BranchInfo;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

function trackingLabel(branch: BranchInfo): string {
  if (branch.is_remote) {
    return branch.remote_name ?? "Remote";
  }
  if (branch.upstream) {
    return branch.upstream;
  }
  return "Local only";
}

export function BranchRow({ branch, isSelected, onSelect }: BranchRowProps) {
  const classNames = [
    "branch-row",
    branch.is_head ? "current" : "",
    branch.is_remote ? "remote" : "",
    isSelected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classNames}
      onClick={() => onSelect(branch.name)}
    >
      <div className="branch-icon">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z" />
        </svg>
      </div>
      <div className="branch-details">
        <div className="branch-name">{branch.name}</div>
        <div
          className={`branch-tracking${branch.upstream ? "" : " local-only"}`}
        >
          {trackingLabel(branch)}
        </div>
      </div>
      {branch.is_head && <span className="current-badge">HEAD</span>}
    </button>
  );
}
