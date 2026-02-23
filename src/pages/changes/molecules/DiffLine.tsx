import type {
  DiffLine as DiffLineType,
  WordSegment,
} from "../../../services/git";

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

function wordHighlightClass(
  kind: DiffLineType["kind"],
  highlighted: boolean,
): string | undefined {
  if (!highlighted) return undefined;
  if (kind === "addition") return "word-add";
  if (kind === "deletion") return "word-del";
  return undefined;
}

function segmentKey(seg: WordSegment, index: number): string {
  return `${index}-${seg.highlighted ? "h" : "n"}-${seg.text.length}`;
}

function renderContent(line: DiffLineType) {
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

export function DiffLineRow({ line }: DiffLineProps) {
  return (
    <div className={lineClass(line.kind)}>
      <span className="line-num">{line.old_lineno ?? ""}</span>
      <span className="line-num">{line.new_lineno ?? ""}</span>
      {renderContent(line)}
    </div>
  );
}
