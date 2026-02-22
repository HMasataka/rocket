import type { BranchInfo } from "../../../services/git";
import { BranchRow } from "../molecules/BranchRow";

interface BranchListPanelProps {
  branches: BranchInfo[];
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
}

export function BranchListPanel({
  branches,
  selectedBranch,
  onSelectBranch,
}: BranchListPanelProps) {
  const localBranches = branches.filter((b) => !b.is_remote);
  const remoteBranches = branches.filter((b) => b.is_remote);

  return (
    <div className="branches-list-panel">
      <div className="branch-list">
        <div className="branch-section-label">Local</div>
        {localBranches.map((branch) => (
          <BranchRow
            key={branch.name}
            branch={branch}
            isSelected={selectedBranch === branch.name}
            onSelect={onSelectBranch}
          />
        ))}
        {remoteBranches.length > 0 && (
          <>
            <div className="branch-section-label">Remote</div>
            {remoteBranches.map((branch) => (
              <BranchRow
                key={branch.name}
                branch={branch}
                isSelected={selectedBranch === branch.name}
                onSelect={onSelectBranch}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
