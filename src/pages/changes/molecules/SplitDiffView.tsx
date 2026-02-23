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
  selectedLines?: Set<string>;
  onStageHunk?: (hunk: HunkIdentifier) => void;
  onDiscardHunk?: (hunk: HunkIdentifier) => void;
  onToggleLine?: (lineKey: string) => void;
  onStageLines?: (hunkIndex: number) => void;
  onDiscardLines?: (hunkIndex: number) => void;
}

interface SplitRow {
  left: DiffLine | null;
  right: DiffLine | null;
  leftIndex: number | null;
  rightIndex: number | null;
}

function buildSplitRows(hunk: DiffHunkType, baseIndex: number): SplitRow[] {
  const rows: SplitRow[] = [];
  const lines = hunk.lines;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.kind === "context") {
      rows.push({
        left: line,
        right: line,
        leftIndex: baseIndex + i,
        rightIndex: baseIndex + i,
      });
      i++;
    } else if (line.kind === "deletion") {
      const delLines: { line: DiffLine; idx: number }[] = [];
      while (i < lines.length && lines[i].kind === "deletion") {
        delLines.push({ line: lines[i], idx: baseIndex + i });
        i++;
      }
      const addLines: { line: DiffLine; idx: number }[] = [];
      while (i < lines.length && lines[i].kind === "addition") {
        addLines.push({ line: lines[i], idx: baseIndex + i });
        i++;
      }
      const maxLen = Math.max(delLines.length, addLines.length);
      for (let j = 0; j < maxLen; j++) {
        rows.push({
          left: delLines[j]?.line ?? null,
          right: addLines[j]?.line ?? null,
          leftIndex: delLines[j]?.idx ?? null,
          rightIndex: addLines[j]?.idx ?? null,
        });
      }
    } else if (line.kind === "addition") {
      rows.push({
        left: null,
        right: line,
        leftIndex: null,
        rightIndex: baseIndex + i,
      });
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

function renderCheckbox(
  line: DiffLine | null,
  hunkIndex: number,
  lineIndex: number | null,
  selectedLines: Set<string> | undefined,
  onToggleLine: ((lineKey: string) => void) | undefined,
) {
  if (
    !line ||
    !onToggleLine ||
    lineIndex === null ||
    (line.kind !== "addition" && line.kind !== "deletion")
  ) {
    return <span className="line-checkbox-placeholder" />;
  }
  const lineKey = `${hunkIndex}-${lineIndex}`;
  return (
    <input
      type="checkbox"
      className="line-checkbox"
      checked={selectedLines?.has(lineKey) ?? false}
      onChange={() => onToggleLine(lineKey)}
    />
  );
}

export function SplitDiffView({
  diffs,
  staged,
  selectedLines,
  onStageHunk,
  onDiscardHunk,
  onToggleLine,
  onStageLines,
  onDiscardLines,
}: SplitDiffViewProps) {
  let globalHunkIndex = 0;

  return (
    <div className="diff-split">
      <div className="split-pane split-left">
        <div className="split-header">
          <span className="split-label">Old</span>
        </div>
        <div className="split-code">
          <div className="split-code-inner">
            {(() => {
              let hunkIdx = 0;
              return diffs.map((fileDiff) =>
                fileDiff.hunks.map((hunk) => {
                  const currentHunkIndex = hunkIdx;
                  hunkIdx++;
                  const rows = buildSplitRows(hunk, 0);
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
                          {renderCheckbox(
                            row.left,
                            currentHunkIndex,
                            row.leftIndex,
                            selectedLines,
                            row.left?.kind === "deletion"
                              ? onToggleLine
                              : undefined,
                          )}
                          <span className="line-num">
                            {row.left?.old_lineno ?? ""}
                          </span>
                          {renderLineContent(row.left)}
                        </div>
                      ))}
                    </div>
                  );
                }),
              );
            })()}
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
                const currentHunkIndex = globalHunkIndex;
                globalHunkIndex++;
                const rows = buildSplitRows(hunk, 0);
                const hunkId = toHunkIdentifier(hunk);
                const hasSelected =
                  selectedLines &&
                  hasSelectedLinesInHunk(
                    currentHunkIndex,
                    hunk.lines.length,
                    selectedLines,
                  );
                return (
                  <div key={hunk.header}>
                    <div className="split-hunk-header">
                      <span>{hunk.header}</span>
                      <div className="hunk-actions">
                        {hasSelected && (
                          <>
                            {onStageLines && (
                              <button
                                type="button"
                                className="hunk-btn"
                                onClick={() => onStageLines(currentHunkIndex)}
                              >
                                {staged ? "Unstage Lines" : "Stage Lines"}
                              </button>
                            )}
                            {!staged && onDiscardLines && (
                              <button
                                type="button"
                                className="hunk-btn"
                                onClick={() => onDiscardLines(currentHunkIndex)}
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
                    {rows.map((row, idx) => (
                      <div
                        key={rowKey(row, idx)}
                        className={splitLineClass(row.right)}
                      >
                        {renderCheckbox(
                          row.right,
                          currentHunkIndex,
                          row.rightIndex,
                          selectedLines,
                          row.right?.kind === "addition"
                            ? onToggleLine
                            : undefined,
                        )}
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
