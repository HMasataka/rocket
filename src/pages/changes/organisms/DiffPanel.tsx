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
        {diffs.map((fileDiff) => (
          <div key={fileDiff.new_path ?? fileDiff.old_path}>
            {fileDiff.hunks.map((hunk) => (
              <DiffHunkView key={hunk.header} hunk={hunk} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
