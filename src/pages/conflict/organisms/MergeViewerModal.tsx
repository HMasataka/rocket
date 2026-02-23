import { useCallback, useEffect, useState } from "react";
import type { MergeBaseContent } from "../../../services/conflict";
import { getMergeBaseContent } from "../../../services/conflict";
import "../../../styles/merge-viewer.css";

interface MergeViewerModalProps {
  path: string;
  onApply: (content: string) => void;
  onCancel: () => void;
}

export function MergeViewerModal({
  path,
  onApply,
  onCancel,
}: MergeViewerModalProps) {
  const [content, setContent] = useState<MergeBaseContent | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMergeBaseContent(path)
      .then((data) => {
        setContent(data);
        setResult(data.ours_content);
      })
      .catch((e: unknown) => {
        setError(String(e));
      });
  }, [path]);

  const handleApply = useCallback(() => {
    onApply(result);
  }, [result, onApply]);

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: overlay dismiss */}
      <div
        className="modal-overlay active"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="modal merge-viewer-modal active">
        <div className="modal-header">
          <span className="modal-title">3-way Merge Viewer</span>
          <button type="button" className="modal-close" onClick={onCancel}>
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        </div>

        <div className="modal-body merge-body">
          {error && <div className="error-message">{error}</div>}
          {content && (
            <div className="merge-panels">
              <div className="merge-panel">
                <div className="merge-panel-header ours">Ours (Current)</div>
                <pre className="merge-code">{content.ours_content}</pre>
              </div>
              <div className="merge-panel">
                <div className="merge-panel-header base">
                  Base (Common Ancestor)
                </div>
                <pre className="merge-code">
                  {content.base_content ?? "(no base available)"}
                </pre>
              </div>
              <div className="merge-panel">
                <div className="merge-panel-header theirs">
                  Theirs (Incoming)
                </div>
                <pre className="merge-code">{content.theirs_content}</pre>
              </div>
              <div className="merge-panel">
                <div className="merge-panel-header result-header">Result</div>
                <textarea
                  className="merge-result"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!content}
          >
            Apply Result
          </button>
        </div>
      </div>
    </>
  );
}
