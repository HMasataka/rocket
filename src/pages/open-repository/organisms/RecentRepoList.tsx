import type { RecentRepo } from "../../../services/repo";
import { RepoRow } from "../molecules/RepoRow";

interface RecentRepoListProps {
  repos: RecentRepo[];
  onSelect: (path: string) => void;
}

export function RecentRepoList({ repos, onSelect }: RecentRepoListProps) {
  if (repos.length === 0) {
    return null;
  }

  return (
    <div className="newtab-section">
      <div className="newtab-section-header">
        <span className="newtab-section-title">Recent Repositories</span>
        <span className="newtab-section-count">{repos.length}</span>
      </div>
      <div className="newtab-repo-list">
        {repos.map((repo) => (
          <RepoRow key={repo.path} repo={repo} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}
