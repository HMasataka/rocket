import { useCallback, useState } from "react";
import { AiIcon } from "../../../components/atoms/AiIcon";
import type { ConflictSuggestion } from "../../../services/ai";
import type {
  ConflictBlock,
  ConflictResolution,
} from "../../../services/conflict";
import { useAiStore } from "../../../stores/aiStore";
import { useUIStore } from "../../../stores/uiStore";

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
  const [suggestion, setSuggestion] = useState<ConflictSuggestion | null>(null);
  const resolveConflict = useAiStore((s) => s.resolveConflict);
  const resolving = useAiStore((s) => s.resolving);
  const addToast = useUIStore((s) => s.addToast);

  const handleAiResolve = useCallback(async () => {
    try {
      const result = await resolveConflict(
        block.ours,
        block.theirs,
        block.base,
      );
      setSuggestion(result);
    } catch (e) {
      addToast(String(e), "error");
    }
  }, [block.ours, block.theirs, block.base, resolveConflict, addToast]);

  const handleAcceptSuggestion = useCallback(() => {
    if (!suggestion) return;
    onResolve({ type: "Manual", content: suggestion.resolved_code });
    setSuggestion(null);
  }, [suggestion, onResolve]);

  const handleRejectSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  return (
    <div className="conflict-section">
      <div className="conflict-section-label">
        <span className="conflict-section-num">
          {index + 1} / {total}
        </span>
        <div className="conflict-section-right">
          {suggestion && (
            <span className="ai-resolved-badge">
              <AiIcon />
              AI Resolved
            </span>
          )}
          <span className="conflict-section-location">
            Line {block.start_line}-{block.end_line}
          </span>
        </div>
      </div>
      <div className="conflict-block">
        <div className="conflict-header ours">{"<<<<<<< HEAD (current)"}</div>
        <pre className="conflict-code">{block.ours}</pre>
        <div className="conflict-header marker">{"======="}</div>
        <pre className="conflict-code">{block.theirs}</pre>
        <div className="conflict-header theirs">{">>>>>>> theirs"}</div>
      </div>
      {suggestion ? (
        <div className="ai-suggestion">
          <div className="ai-suggestion-header">
            <AiIcon />
            <span className="ai-suggestion-title">AI Suggestion</span>
            <span
              className={`ai-suggestion-confidence ${suggestion.confidence}`}
            >
              {suggestion.confidence.charAt(0).toUpperCase() +
                suggestion.confidence.slice(1)}{" "}
              confidence
            </span>
          </div>
          <pre className="ai-suggestion-code">{suggestion.resolved_code}</pre>
          <div className="ai-suggestion-reason">{suggestion.reason}</div>
          <div className="ai-suggestion-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRejectSuggestion}
            >
              Reject
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAcceptSuggestion}
            >
              Accept AI
            </button>
          </div>
        </div>
      ) : (
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
          <button
            type="button"
            className="ai-resolve-btn btn-sm"
            onClick={handleAiResolve}
            disabled={resolving}
          >
            {resolving ? <div className="ai-spinner" /> : <AiIcon />}
            AI Resolve
          </button>
        </div>
      )}
    </div>
  );
}
