import { useCallback, useState } from "react";
import { AiIcon } from "../../../components/atoms/AiIcon";
import type {
  ConflictFile,
  ConflictResolution,
} from "../../../services/conflict";
import { useAiStore } from "../../../stores/aiStore";
import { useUIStore } from "../../../stores/uiStore";
import { ConflictSection } from "../molecules/ConflictSection";

interface ConflictDetailProps {
  file: ConflictFile;
  isResolved: boolean;
  onResolveBlock: (blockIndex: number, resolution: ConflictResolution) => void;
  onResolveFile: (resolution: ConflictResolution) => void;
  onMarkResolved: () => void;
  onOpenMergeViewer: () => void;
}

export function ConflictDetail({
  file,
  isResolved,
  onResolveBlock,
  onResolveFile,
  onMarkResolved,
  onOpenMergeViewer,
}: ConflictDetailProps) {
  const [resolvingAll, setResolvingAll] = useState(false);
  const resolveConflict = useAiStore((s) => s.resolveConflict);
  const addToast = useUIStore((s) => s.addToast);

  const handleAiResolveAll = useCallback(async () => {
    setResolvingAll(true);
    try {
      for (let i = 0; i < file.conflicts.length; i++) {
        const block = file.conflicts[i];
        const suggestion = await resolveConflict(
          block.ours,
          block.theirs,
          block.base,
        );
        onResolveBlock(i, {
          type: "Manual",
          content: suggestion.resolved_code,
        });
      }
      addToast("AI resolved all conflicts", "success");
    } catch (e) {
      addToast(String(e), "error");
    } finally {
      setResolvingAll(false);
    }
  }, [file.conflicts, resolveConflict, onResolveBlock, addToast]);

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
          className="ai-resolve-all-btn"
          onClick={handleAiResolveAll}
          disabled={resolvingAll}
        >
          {resolvingAll ? <div className="ai-spinner" /> : <AiIcon />}
          AI Resolve All
        </button>
        <div className="conflict-detail-actions-sep" />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onOpenMergeViewer}
        >
          3-way Merge Viewer
        </button>
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
