import type { StashEntry } from "../../../services/stash";
import { StashRow } from "../molecules/StashRow";

interface StashListPanelProps {
  stashes: StashEntry[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function StashListPanel({
  stashes,
  selectedIndex,
  onSelect,
}: StashListPanelProps) {
  if (stashes.length === 0) {
    return (
      <div className="operation-left-panel">
        <div className="stash-list">
          <div className="empty-state">
            <p>No stashes found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="operation-left-panel">
      <div className="stash-list">
        {stashes.map((entry) => (
          <StashRow
            key={entry.index}
            entry={entry}
            selected={selectedIndex === entry.index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
