import type { CommitInfo, SignatureStatus } from "../../../services/history";
import { formatRelativeDate } from "../../../utils/date";
import { refClass } from "../../../utils/refs";

function signatureBadgeClass(status: SignatureStatus): string | null {
  switch (status) {
    case "good":
      return "signature-badge signature-good";
    case "bad":
      return "signature-badge signature-bad";
    case "untrusted":
      return "signature-badge signature-untrusted";
    case "expired":
      return "signature-badge signature-expired";
    case "error":
      return "signature-badge signature-error";
    default:
      return null;
  }
}

function signatureBadgeLabel(status: SignatureStatus): string {
  switch (status) {
    case "good":
      return "Signed";
    case "bad":
      return "Bad sig";
    case "untrusted":
      return "Untrusted";
    case "expired":
      return "Expired";
    case "error":
      return "Sig error";
    default:
      return "";
  }
}

interface CommitRowProps {
  commit: CommitInfo;
  isSelected: boolean;
  onSelect: (oid: string) => void;
}

export function CommitRow({ commit, isSelected, onSelect }: CommitRowProps) {
  const badgeClass = signatureBadgeClass(commit.signature_status);

  return (
    <button
      type="button"
      className={`commit-row${isSelected ? " selected" : ""}`}
      onClick={() => onSelect(commit.oid)}
    >
      <div className="commit-info">
        <div className="commit-message-row">
          <span className="commit-message">{commit.message}</span>
          {badgeClass && (
            <span className={badgeClass}>
              {signatureBadgeLabel(commit.signature_status)}
            </span>
          )}
          {commit.refs.map((ref) => (
            <span
              key={`${ref.kind}-${ref.name}`}
              className={refClass(ref.kind)}
            >
              {ref.name}
            </span>
          ))}
        </div>
        <div className="commit-meta">
          <span className="commit-hash">{commit.short_oid}</span>
          <span className="commit-author">{commit.author_name}</span>
          <span className="commit-date">
            {formatRelativeDate(commit.author_date)}
          </span>
        </div>
      </div>
    </button>
  );
}
