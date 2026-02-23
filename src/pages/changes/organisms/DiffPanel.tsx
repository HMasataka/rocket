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
}

export function DiffPanel({
  selectedFile,
  diffs,
  staged,
  diffViewMode,
  onSetDiffViewMode,
  onStageHunk,
  onDiscardHunk,
}: DiffPanelProps) {
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
                {fileDiff.hunks.map((hunk) => (
                  <DiffHunkView
                    key={hunk.header}
                    hunk={hunk}
                    staged={staged}
                    onStageHunk={onStageHunk}
                    onDiscardHunk={onDiscardHunk}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <SplitDiffView
          diffs={diffs}
          staged={staged}
          onStageHunk={onStageHunk}
          onDiscardHunk={onDiscardHunk}
        />
      )}
    </div>
  );
}
