import { AiIcon } from "../../../components/atoms/AiIcon";
import type { ReviewComment } from "../../../services/ai";

interface AiReviewCommentProps {
  comment: ReviewComment;
  onDismiss: () => void;
}

function typeToClassName(type: ReviewComment["type"]): string {
  switch (type) {
    case "error":
      return "danger";
    case "warning":
      return "warning";
    case "info":
      return "info";
  }
}

function typeToLabel(type: ReviewComment["type"]): string {
  switch (type) {
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    case "info":
      return "Info";
  }
}

export function AiReviewComment({ comment, onDismiss }: AiReviewCommentProps) {
  const lineRange =
    comment.line_start === comment.line_end
      ? `L${comment.line_start}`
      : `L${comment.line_start}-${comment.line_end}`;

  return (
    <div className="ai-review-inline">
      <div className="ai-review-inline-header">
        <AiIcon />
        <span className="ai-review-inline-label">AI Review</span>
        <span
          className={`ai-review-inline-type ${typeToClassName(comment.type)}`}
        >
          {typeToLabel(comment.type)}
        </span>
        <span className="ai-review-inline-line">{lineRange}</span>
      </div>
      <div className="ai-review-inline-message">{comment.message}</div>
      <div className="ai-review-inline-actions">
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
