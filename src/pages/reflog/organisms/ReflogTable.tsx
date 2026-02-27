import type { ReflogEntry } from "../../../services/reflog";
import { ReflogRow } from "../molecules/ReflogRow";

interface ReflogTableProps {
  entries: ReflogEntry[];
  onCheckout: (oid: string) => void;
  onResetToHere: (oid: string) => void;
}

export function ReflogTable({
  entries,
  onCheckout,
  onResetToHere,
}: ReflogTableProps) {
  if (entries.length === 0) {
    return (
      <div className="preview-empty">
        <p>No reflog entries found</p>
      </div>
    );
  }

  return (
    <div className="reflog-table">
      <div className="reflog-header">
        <span>Ref</span>
        <span>Hash</span>
        <span>Action</span>
        <span>Message</span>
        <span>Date</span>
        <span>Actions</span>
      </div>
      {entries.map((entry) => (
        <ReflogRow
          key={`${entry.index}-${entry.new_oid}`}
          entry={entry}
          onCheckout={onCheckout}
          onResetToHere={onResetToHere}
        />
      ))}
    </div>
  );
}
