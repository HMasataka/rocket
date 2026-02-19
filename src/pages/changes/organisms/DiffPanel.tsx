import type { FileDiff } from "../../../services/git";
import { DiffHunkView } from "../molecules/DiffHunk";

interface DiffPanelProps {
  selectedFile: string | null;
  diffs: FileDiff[];
}

export function DiffPanel({ selectedFile, diffs }: DiffPanelProps) {
  return (
    <div className="diff-panel">
      <div className="panel-header">
        <span className={`panel-title${selectedFile ? "" : " dim"}`}>
          {selectedFile ?? "No file selected"}
        </span>
      </div>
      <div className="diff-content" style={{ display: "block" }}>
        {diffs.map((fileDiff, i) => (
          <div key={i}>
            {fileDiff.hunks.map((hunk, j) => (
              <DiffHunkView key={j} hunk={hunk} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
