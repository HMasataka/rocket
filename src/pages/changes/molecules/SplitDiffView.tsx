import type {
  DiffHunk as DiffHunkType,
  DiffLine,
  FileDiff,
  HunkIdentifier,
  WordSegment,
} from "../../../services/git";
import {
  segmentKey,
  toHunkIdentifier,
  wordHighlightClass,
} from "../utils/diffUtils";

interface SplitDiffViewProps {
  diffs: FileDiff[];
  staged: boolean;
  onStageHunk?: (hunk: HunkIdentifier) => void;
  onDiscardHunk?: (hunk: HunkIdentifier) => void;
}

interface SplitRow {
  left: DiffLine | null;
  right: DiffLine | null;
}

function buildSplitRows(hunk: DiffHunkType): SplitRow[] {
  const rows: SplitRow[] = [];
  const lines = hunk.lines;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.kind === "context") {
      rows.push({ left: line, right: line });
      i++;
    } else if (line.kind === "deletion") {
      const delLines: DiffLine[] = [];
      while (i < lines.length && lines[i].kind === "deletion") {
        delLines.push(lines[i]);
        i++;
      }
      const addLines: DiffLine[] = [];
      while (i < lines.length && lines[i].kind === "addition") {
        addLines.push(lines[i]);
        i++;
      }
      const maxLen = Math.max(delLines.length, addLines.length);
      for (let j = 0; j < maxLen; j++) {
        rows.push({
          left: delLines[j] ?? null,
          right: addLines[j] ?? null,
        });
      }
    } else if (line.kind === "addition") {
      rows.push({ left: null, right: line });
      i++;
    } else {
      i++;
    }
  }
  return rows;
}

function renderLineContent(line: DiffLine | null) {
  if (!line) return <span className="line-content" />;
  if (!line.word_diff) {
    return <span className="line-content">{line.content}</span>;
  }
  return (
    <span className="line-content">
      {line.word_diff.map((seg: WordSegment, i: number) => {
        const cls = wordHighlightClass(line.kind, seg.highlighted);
        const key = segmentKey(seg, i);
        return cls ? (
          <span key={key} className={cls}>
            {seg.text}
          </span>
        ) : (
          <span key={key}>{seg.text}</span>
        );
      })}
    </span>
  );
}

function splitLineClass(line: DiffLine | null): string {
  if (!line) return "split-line empty";
  if (line.kind === "addition") return "split-line add";
  if (line.kind === "deletion") return "split-line del";
  return "split-line unchanged";
}

function rowKey(row: SplitRow, index: number): string {
  const leftPart = row.left
    ? `${row.left.old_lineno ?? "n"}-${row.left.new_lineno ?? "n"}`
    : "empty";
  const rightPart = row.right
    ? `${row.right.old_lineno ?? "n"}-${row.right.new_lineno ?? "n"}`
    : "empty";
  return `${index}-${leftPart}-${rightPart}`;
}

export function SplitDiffView({
  diffs,
  staged,
  onStageHunk,
  onDiscardHunk,
}: SplitDiffViewProps) {
  return (
    <div className="diff-split">
      <div className="split-pane split-left">
        <div className="split-header">
          <span className="split-label">Old</span>
        </div>
        <div className="split-code">
          <div className="split-code-inner">
            {diffs.map((fileDiff) =>
              fileDiff.hunks.map((hunk) => {
                const rows = buildSplitRows(hunk);
                return (
                  <div key={hunk.header}>
                    <div className="split-hunk-header">
                      <span>{hunk.header}</span>
                    </div>
                    {rows.map((row, idx) => (
                      <div
                        key={rowKey(row, idx)}
                        className={splitLineClass(row.left)}
                      >
                        <span className="line-num">
                          {row.left?.old_lineno ?? ""}
                        </span>
                        {renderLineContent(row.left)}
                      </div>
                    ))}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
      <div className="split-divider" />
      <div className="split-pane split-right">
        <div className="split-header">
          <span className="split-label">New</span>
        </div>
        <div className="split-code">
          <div className="split-code-inner">
            {diffs.map((fileDiff) =>
              fileDiff.hunks.map((hunk) => {
                const rows = buildSplitRows(hunk);
                const hunkId = toHunkIdentifier(hunk);
                return (
                  <div key={hunk.header}>
                    <div className="split-hunk-header">
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
                    {rows.map((row, idx) => (
                      <div
                        key={rowKey(row, idx)}
                        className={splitLineClass(row.right)}
                      >
                        <span className="line-num">
                          {row.right?.new_lineno ?? ""}
                        </span>
                        {renderLineContent(row.right)}
                      </div>
                    ))}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
