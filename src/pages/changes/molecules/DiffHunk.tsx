import type {
  DiffHunk as DiffHunkType,
  HunkIdentifier,
} from "../../../services/git";
import { toHunkIdentifier } from "../utils/diffUtils";
import { DiffLineRow } from "./DiffLine";

interface DiffHunkProps {
  hunk: DiffHunkType;
  staged?: boolean;
  onStageHunk?: (hunk: HunkIdentifier) => void;
  onDiscardHunk?: (hunk: HunkIdentifier) => void;
}

export function DiffHunkView({
  hunk,
  staged,
  onStageHunk,
  onDiscardHunk,
}: DiffHunkProps) {
  const hunkId = toHunkIdentifier(hunk);

  return (
    <div className="diff-hunk">
      <div className="diff-hunk-header">
        <span>{hunk.header}</span>
        <div className="hunk-actions">
          {staged ? (
            <button
              type="button"
              className="hunk-btn"
              onClick={() => onStageHunk?.(hunkId)}
            >
              Unstage Hunk
            </button>
          ) : (
            <>
              <button
                type="button"
                className="hunk-btn"
                onClick={() => onStageHunk?.(hunkId)}
              >
                Stage Hunk
              </button>
              <button
                type="button"
                className="hunk-btn"
                onClick={() => onDiscardHunk?.(hunkId)}
              >
                Discard
              </button>
            </>
          )}
        </div>
      </div>
      {hunk.lines.map((line) => (
        <DiffLineRow
          key={`${line.kind}-${line.old_lineno ?? "n"}-${line.new_lineno ?? "n"}`}
          line={line}
        />
      ))}
    </div>
  );
}
