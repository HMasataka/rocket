import type { DiffLine as DiffLineType } from "../../../services/git";

interface DiffLineProps {
  line: DiffLineType;
}

function lineClass(kind: DiffLineType["kind"]): string {
  switch (kind) {
    case "addition":
      return "diff-line add";
    case "deletion":
      return "diff-line del";
    default:
      return "diff-line";
  }
}

export function DiffLineRow({ line }: DiffLineProps) {
  return (
    <div className={lineClass(line.kind)}>
      <span className="line-num">{line.old_lineno ?? ""}</span>
      <span className="line-num">{line.new_lineno ?? ""}</span>
      <span className="line-content">{line.content}</span>
    </div>
  );
}
