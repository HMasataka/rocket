import type { ReviewComment } from "../../../services/ai";
import type {
  DiffHunk as DiffHunkType,
  HunkIdentifier,
} from "../../../services/git";
import { toHunkIdentifier } from "../utils/diffUtils";
import { AiReviewComment } from "./AiReviewComment";
import { DiffLineRow } from "./DiffLine";

interface DiffHunkProps {
  hunk: DiffHunkType;
  hunkIndex: number;
  staged?: boolean;
  selectedLines?: Set<string>;
  reviewComments?: ReviewComment[];
  onStageHunk?: (hunk: HunkIdentifier) => void;
  onDiscardHunk?: (hunk: HunkIdentifier) => void;
  onToggleLine?: (lineKey: string) => void;
  onStageLines?: (hunkIndex: number) => void;
  onDiscardLines?: (hunkIndex: number) => void;
  onDismissReviewComment?: (comment: ReviewComment) => void;
}

function hasSelectedLinesInHunk(
  hunkIndex: number,
  lineCount: number,
  selectedLines: Set<string>,
): boolean {
  for (let i = 0; i < lineCount; i++) {
    if (selectedLines.has(`${hunkIndex}-${i}`)) {
      return true;
    }
  }
  return false;
}

export function DiffHunkView({
  hunk,
  hunkIndex,
  staged,
  selectedLines,
  reviewComments,
  onStageHunk,
  onDiscardHunk,
  onToggleLine,
  onStageLines,
  onDiscardLines,
  onDismissReviewComment,
}: DiffHunkProps) {
  const hunkId = toHunkIdentifier(hunk);
  const hasSelected =
    selectedLines &&
    hasSelectedLinesInHunk(hunkIndex, hunk.lines.length, selectedLines);

  return (
    <div className="diff-hunk">
      <div className="diff-hunk-header">
        <span>{hunk.header}</span>
        <div className="hunk-actions">
          {hasSelected && (
            <>
              {onStageLines && (
                <button
                  type="button"
                  className="hunk-btn"
                  onClick={() => onStageLines(hunkIndex)}
                >
                  {staged ? "Unstage Lines" : "Stage Lines"}
                </button>
              )}
              {!staged && onDiscardLines && (
                <button
                  type="button"
                  className="hunk-btn"
                  onClick={() => onDiscardLines(hunkIndex)}
                >
                  Discard Lines
                </button>
              )}
            </>
          )}
          {staged ? (
            onStageHunk && (
              <button
                type="button"
                className="hunk-btn"
                onClick={() => onStageHunk(hunkId)}
              >
                Unstage Hunk
              </button>
            )
          ) : (
            <>
              {onStageHunk && (
                <button
                  type="button"
                  className="hunk-btn"
                  onClick={() => onStageHunk(hunkId)}
                >
                  Stage Hunk
                </button>
              )}
              {onDiscardHunk && (
                <button
                  type="button"
                  className="hunk-btn"
                  onClick={() => onDiscardHunk(hunkId)}
                >
                  Discard
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {hunk.lines.map((line, lineIndex) => {
        const lineKey = `${hunkIndex}-${lineIndex}`;
        const lineNo = line.new_lineno ?? line.old_lineno ?? 0;
        const commentsAfterLine = reviewComments?.filter(
          (c) => c.line_end === lineNo,
        );
        return (
          <div key={lineKey}>
            <DiffLineRow
              line={line}
              lineKey={lineKey}
              selected={selectedLines?.has(lineKey)}
              onToggleLine={onToggleLine}
            />
            {commentsAfterLine?.map((comment) => (
              <AiReviewComment
                key={`review-${comment.file}-${comment.line_start}-${comment.line_end}`}
                comment={comment}
                onDismiss={() => {
                  onDismissReviewComment?.(comment);
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
