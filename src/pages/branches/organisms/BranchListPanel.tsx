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
  return (
    <div className="branches-list-panel">
      <div className="branch-list">
        {branches.map((branch) => (
          <BranchRow
            key={branch.name}
            branch={branch}
            isSelected={selectedBranch === branch.name}
            onSelect={onSelectBranch}
          />
        ))}
      </div>
    </div>
  );
}
