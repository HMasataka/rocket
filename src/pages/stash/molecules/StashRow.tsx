import type { StashEntry } from "../../../services/stash";

interface StashRowProps {
  entry: StashEntry;
  selected: boolean;
  onSelect: (index: number) => void;
}

function formatRelativeDate(timestamp: number): string {
  if (timestamp === 0) return "";
  const diff = Date.now() / 1000 - timestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function StashRow({ entry, selected, onSelect }: StashRowProps) {
  return (
    <button
      type="button"
      className={`stash-row${selected ? " selected" : ""}`}
      onClick={() => onSelect(entry.index)}
    >
      <div className="stash-radio">
        <input type="radio" checked={selected} readOnly />
      </div>
      <div className="stash-graph">
        <div className="graph-node stash" />
      </div>
      <div className="stash-info">
        <div className="stash-message">{entry.message}</div>
        <div className="stash-meta">
          <span className="stash-index-label">
            stash@{"{"}
            {entry.index}
            {"}"}
          </span>
          {entry.branch_name && <span>{entry.branch_name}</span>}
          {entry.author_date > 0 && (
            <span>{formatRelativeDate(entry.author_date)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
