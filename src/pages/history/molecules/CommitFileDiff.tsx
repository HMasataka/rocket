import type { FileDiff } from "../../../services/git";
import { DiffHunkView } from "../../changes/molecules/DiffHunk";

interface CommitFileDiffProps {
  path: string;
  diffs: FileDiff[];
}

export function CommitFileDiff({ path, diffs }: CommitFileDiffProps) {
  return (
    <div className="unified-file-diff">
      <div className="diff-preview-header">
        <span className="diff-preview-path">{path}</span>
      </div>
      <div className="diff-preview-content">
        {diffs.map((diff) =>
          diff.hunks.map((hunk) => (
            <DiffHunkView key={hunk.header} hunk={hunk} />
          )),
        )}
      </div>
    </div>
  );
}
