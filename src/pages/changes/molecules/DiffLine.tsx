import type {
  DiffLine as DiffLineType,
  WordSegment,
} from "../../../services/git";
import { segmentKey, wordHighlightClass } from "../utils/diffUtils";

interface DiffLineProps {
  line: DiffLineType;
  lineKey?: string;
  selected?: boolean;
  onToggleLine?: (lineKey: string) => void;
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

export function DiffLineRow({
  line,
  lineKey,
  selected,
  onToggleLine,
}: DiffLineProps) {
  const showCheckbox =
    onToggleLine &&
    lineKey &&
    (line.kind === "addition" || line.kind === "deletion");

  return (
    <div className={lineClass(line.kind)}>
      {showCheckbox ? (
        <input
          type="checkbox"
          className="line-checkbox"
          checked={selected ?? false}
          onChange={() => onToggleLine(lineKey)}
        />
      ) : (
        <span className="line-checkbox-placeholder" />
      )}
      <span className="line-num">{line.old_lineno ?? ""}</span>
      <span className="line-num">{line.new_lineno ?? ""}</span>
      {renderContent(line)}
    </div>
  );
}
