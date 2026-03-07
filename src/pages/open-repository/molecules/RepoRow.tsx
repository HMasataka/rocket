import type { RecentRepo } from "../../../services/repo";

interface RepoRowProps {
  repo: RecentRepo;
  onClick: (path: string) => void;
}

function repoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
    </svg>
  );
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return `${Math.floor(diffDay / 7)} weeks ago`;
}

export function RepoRow({ repo, onClick }: RepoRowProps) {
  return (
    <button
      type="button"
      className="newtab-repo-row"
      onClick={() => onClick(repo.path)}
    >
      <div className="newtab-repo-icon">{repoIcon()}</div>
      <div className="newtab-repo-info">
        <div className="newtab-repo-name">{repo.name}</div>
        <div className="newtab-repo-path">{repo.path}</div>
      </div>
      <div className="newtab-repo-meta">
        <span className="newtab-repo-date">
          {formatRelativeTime(repo.last_opened)}
        </span>
      </div>
    </button>
  );
}
