import type {
  ConflictFile,
  ConflictResolution,
} from "../../../services/conflict";
import { ConflictSection } from "../molecules/ConflictSection";

interface ConflictDetailProps {
  file: ConflictFile;
  isResolved: boolean;
  onResolveBlock: (blockIndex: number, resolution: ConflictResolution) => void;
  onResolveFile: (resolution: ConflictResolution) => void;
  onMarkResolved: () => void;
}

export function ConflictDetail({
  file,
  isResolved,
  onResolveBlock,
  onResolveFile,
  onMarkResolved,
}: ConflictDetailProps) {
  return (
    <div className="conflict-detail">
      <div className="conflict-detail-header">
        <span className="conflict-detail-filename">{file.path}</span>
        <span className="conflict-detail-count">
          {file.conflict_count} conflict{file.conflict_count !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="conflict-blocks">
        {file.conflicts.map((block, i) => (
          <ConflictSection
            key={`${file.path}-${block.start_line}`}
            block={block}
            index={i}
            total={file.conflicts.length}
            onResolve={(resolution) => onResolveBlock(i, resolution)}
          />
        ))}
      </div>

      <div className="conflict-detail-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onResolveFile({ type: "Ours" })}
        >
          Accept All Ours
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onResolveFile({ type: "Theirs" })}
        >
          Accept All Theirs
        </button>
        <button
          type="button"
          className="btn btn-success btn-sm"
          disabled={isResolved}
          onClick={onMarkResolved}
        >
          Mark as Resolved
        </button>
      </div>
    </div>
  );
}
