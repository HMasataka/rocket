import type { DiffHunk as DiffHunkType } from "../../../services/git";
import { DiffLineRow } from "./DiffLine";

interface DiffHunkProps {
  hunk: DiffHunkType;
}

export function DiffHunkView({ hunk }: DiffHunkProps) {
  return (
    <div className="diff-hunk">
      <div className="diff-hunk-header">
        <span>{hunk.header}</span>
      </div>
      {hunk.lines.map((line, i) => (
        <DiffLineRow key={i} line={line} />
      ))}
    </div>
  );
}
