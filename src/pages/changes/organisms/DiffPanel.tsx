import { useCallback, useRef, useState } from "react";
import type { FileDiff, HunkIdentifier } from "../../../services/git";
import type { DiffViewMode } from "../../../stores/uiStore";
import { DiffHunkView } from "../molecules/DiffHunk";
import { SplitDiffView } from "../molecules/SplitDiffView";

interface DiffPanelProps {
  selectedFile: string | null;
  diffs: FileDiff[];
  staged: boolean;
  diffViewMode: DiffViewMode;
  onSetDiffViewMode: (mode: DiffViewMode) => void;
  onStageHunk?: (hunk: HunkIdentifier) => void;
  onDiscardHunk?: (hunk: HunkIdentifier) => void;
  onStageLines?: (hunkIndex: number, lineIndices: number[]) => void;
  onDiscardLines?: (hunkIndex: number, lineIndices: number[]) => void;
}

export function DiffPanel({
  selectedFile,
  diffs,
  staged,
  diffViewMode,
  onSetDiffViewMode,
  onStageHunk,
  onDiscardHunk,
  onStageLines,
  onDiscardLines,
}: DiffPanelProps) {
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const prevDiffsRef = useRef(diffs);

  // Reset selection when diffs change
  if (prevDiffsRef.current !== diffs) {
    prevDiffsRef.current = diffs;
    if (selectedLines.size > 0) {
      setSelectedLines(new Set());
    }
  }

  const handleToggleLine = useCallback((lineKey: string) => {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineKey)) {
        next.delete(lineKey);
      } else {
        next.add(lineKey);
      }
      return next;
    });
  }, []);

  const collectSelectedIndices = useCallback(
    (hunkIndex: number): number[] => {
      const indices: number[] = [];
      for (const key of selectedLines) {
        const [hIdx, lIdx] = key.split("-").map(Number);
        if (hIdx === hunkIndex) {
          indices.push(lIdx);
        }
      }
      return indices.sort((a, b) => a - b);
    },
    [selectedLines],
  );

  const handleStageLines = useCallback(
    (hunkIndex: number) => {
      const indices = collectSelectedIndices(hunkIndex);
      if (indices.length === 0) return;
      onStageLines?.(hunkIndex, indices);
    },
    [collectSelectedIndices, onStageLines],
  );

  const handleDiscardLines = useCallback(
    (hunkIndex: number) => {
      const indices = collectSelectedIndices(hunkIndex);
      if (indices.length === 0) return;
      onDiscardLines?.(hunkIndex, indices);
    },
    [collectSelectedIndices, onDiscardLines],
  );

  // Compute global hunk index across file diffs
  let globalHunkIndex = 0;

  return (
    <div className="diff-panel">
      <div className="panel-header">
        <span className={`panel-title${selectedFile ? "" : " dim"}`}>
          {selectedFile ?? "No file selected"}
        </span>
        <div className="view-toggle">
          <button
            type="button"
            className={`toggle-btn${diffViewMode === "inline" ? " active" : ""}`}
            onClick={() => onSetDiffViewMode("inline")}
          >
            Inline
          </button>
          <button
            type="button"
            className={`toggle-btn${diffViewMode === "split" ? " active" : ""}`}
            onClick={() => onSetDiffViewMode("split")}
          >
            Split
          </button>
        </div>
      </div>
      {diffViewMode === "inline" ? (
        <div className="diff-content">
          <div className="diff-content-inner">
            {diffs.map((fileDiff) => (
              <div key={fileDiff.new_path ?? fileDiff.old_path}>
                {fileDiff.hunks.map((hunk) => {
                  const currentHunkIndex = globalHunkIndex;
                  globalHunkIndex++;
                  return (
                    <DiffHunkView
                      key={hunk.header}
                      hunk={hunk}
                      hunkIndex={currentHunkIndex}
                      staged={staged}
                      selectedLines={selectedLines}
                      onStageHunk={onStageHunk}
                      onDiscardHunk={onDiscardHunk}
                      onToggleLine={handleToggleLine}
                      onStageLines={handleStageLines}
                      onDiscardLines={handleDiscardLines}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <SplitDiffView
          diffs={diffs}
          staged={staged}
          selectedLines={selectedLines}
          onStageHunk={onStageHunk}
          onDiscardHunk={onDiscardHunk}
          onToggleLine={handleToggleLine}
          onStageLines={handleStageLines}
          onDiscardLines={handleDiscardLines}
        />
      )}
    </div>
  );
}
