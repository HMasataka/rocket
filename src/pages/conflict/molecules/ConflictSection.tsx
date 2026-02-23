import type {
  ConflictBlock,
  ConflictResolution,
} from "../../../services/conflict";

interface ConflictSectionProps {
  block: ConflictBlock;
  index: number;
  total: number;
  onResolve: (resolution: ConflictResolution) => void;
}

export function ConflictSection({
  block,
  index,
  total,
  onResolve,
}: ConflictSectionProps) {
  return (
    <div className="conflict-section">
      <div className="conflict-section-label">
        <span className="conflict-section-num">
          {index + 1} / {total}
        </span>
        <span className="conflict-section-location">
          Line {block.start_line}-{block.end_line}
        </span>
      </div>
      <div className="conflict-block">
        <div className="conflict-header ours">{"<<<<<<< HEAD (current)"}</div>
        <pre className="conflict-code">{block.ours}</pre>
        <div className="conflict-header marker">{"======="}</div>
        <pre className="conflict-code">{block.theirs}</pre>
        <div className="conflict-header theirs">{">>>>>>> theirs"}</div>
      </div>
      <div className="conflict-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onResolve({ type: "Ours" })}
        >
          Accept Ours
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onResolve({ type: "Theirs" })}
        >
          Accept Theirs
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onResolve({ type: "Both" })}
        >
          Accept Both
        </button>
      </div>
    </div>
  );
}
