import type { ReflogEntry } from "../../../services/reflog";
import { formatRelativeDate } from "../../../utils/date";

interface ReflogRowProps {
  entry: ReflogEntry;
  onCheckout: (oid: string) => void;
  onResetToHere: (oid: string) => void;
}

function actionClassName(action: string): string {
  const lower = action.toLowerCase();
  if (lower.startsWith("commit")) return "commit";
  if (lower.startsWith("checkout")) return "checkout";
  if (lower.startsWith("rebase")) return "rebase";
  if (lower.startsWith("reset")) return "reset";
  if (lower.startsWith("pull")) return "pull";
  if (lower.startsWith("cherry-pick")) return "cherry-pick";
  return "";
}

export function ReflogRow({
  entry,
  onCheckout,
  onResetToHere,
}: ReflogRowProps) {
  return (
    <div className="reflog-row">
      <span className="reflog-index">HEAD@{`{${entry.index}}`}</span>
      <span className="reflog-hash">{entry.new_short_oid}</span>
      <span className={`reflog-action ${actionClassName(entry.action)}`}>
        {entry.action}
      </span>
      <span className="reflog-message">{entry.message}</span>
      <span className="reflog-date">
        {formatRelativeDate(entry.committer_date)}
      </span>
      <span className="reflog-actions">
        <button
          type="button"
          className="icon-btn"
          title="Checkout"
          onClick={(e) => {
            e.stopPropagation();
            onCheckout(entry.new_oid);
          }}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            role="img"
            aria-label="Checkout"
          >
            <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7z" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Reset to here"
          onClick={(e) => {
            e.stopPropagation();
            onResetToHere(entry.new_oid);
          }}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            role="img"
            aria-label="Reset to here"
          >
            <path d="M2 2v4.5h4.5M2 6.5A6.5 6.5 0 1 1 3.29 10" />
          </svg>
        </button>
      </span>
    </div>
  );
}
