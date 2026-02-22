import type { BlameLine as BlameLineType } from "../../../services/history";
import { formatRelativeDate } from "../../../utils/date";

interface BlameLineProps {
  line: BlameLineType;
  blockIndex: number;
}

function ageClass(timestamp: number): string {
  const now = Date.now() / 1000;
  const ageMonths = (now - timestamp) / (30 * 86400);

  if (ageMonths < 1) return "age-new";
  if (ageMonths < 3) return "age-recent";
  if (ageMonths < 6) return "age-mid";
  return "age-old";
}

export function BlameLineRow({ line, blockIndex }: BlameLineProps) {
  const blockClass = blockIndex % 2 === 0 ? "block-even" : "block-odd";
  const startClass = line.is_block_start ? " block-start" : "";

  return (
    <div className={`blame-line ${blockClass}${startClass}`}>
      <div className="blame-gutter">
        {line.is_block_start && (
          <>
            <span className="blame-hash">{line.commit_short_oid}</span>
            <span className="blame-author">{line.author_name}</span>
            <span className="blame-date">
              {formatRelativeDate(line.author_date)}
            </span>
          </>
        )}
      </div>
      <div className={`blame-age ${ageClass(line.author_date)}`} />
      <span className="blame-num">{line.line_number}</span>
      <span className="blame-code">{line.content}</span>
    </div>
  );
}
