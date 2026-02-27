import { useCallback, useState } from "react";
import { Button } from "../../../components/atoms/Button";
import { useAiStore } from "../../../stores/aiStore";
import { useUIStore } from "../../../stores/uiStore";

interface CommitPanelProps {
  onCommit: (message: string, amend: boolean) => void;
  hasStagedFiles: boolean;
  hasChanges: boolean;
  onLoadHeadMessage?: () => Promise<string>;
}

export function CommitPanel({
  onCommit,
  hasStagedFiles,
  hasChanges,
  onLoadHeadMessage,
}: CommitPanelProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [amend, setAmend] = useState(false);

  const generating = useAiStore((s) => s.generating);
  const reviewing = useAiStore((s) => s.reviewing);
  const fetchConfig = useAiStore((s) => s.fetchConfig);
  const generateCommitMessage = useAiStore((s) => s.generateCommitMessage);
  const reviewDiff = useAiStore((s) => s.reviewDiff);
  const addToast = useUIStore((s) => s.addToast);

  const handleCommit = () => {
    const message = body.trim() ? `${subject}\n\n${body}` : subject;
    onCommit(message, amend);
    setSubject("");
    setBody("");
    setAmend(false);
  };

  const handleAmendToggle = useCallback(async () => {
    const next = !amend;
    setAmend(next);
    if (next && onLoadHeadMessage) {
      const msg = await onLoadHeadMessage();
      const [subjectPart, ...rest] = msg.split("\n\n");
      setSubject(subjectPart.trim());
      setBody(rest.join("\n\n").trim());
    } else if (!next) {
      setSubject("");
      setBody("");
    }
  }, [amend, onLoadHeadMessage]);

  const handleAiGenerate = useCallback(async () => {
    try {
      await fetchConfig();
      const config = useAiStore.getState().config;
      const style = config?.commit_message_style ?? "conventional";
      const language = config?.commit_message_language ?? "en";
      const result = await generateCommitMessage(style, language);
      setSubject(result.subject);
      setBody(result.body);
    } catch (e) {
      addToast(String(e), "error");
    }
  }, [fetchConfig, generateCommitMessage, addToast]);

  const handleAiReview = useCallback(async () => {
    try {
      const result = await reviewDiff();
      if (result.comments.length === 0) {
        addToast("AI Review: No issues found", "success");
      } else {
        addToast(`AI Review: ${result.comments.length} issue(s) found`, "info");
      }
    } catch (e) {
      addToast(String(e), "error");
    }
  }, [reviewDiff, addToast]);

  const canCommit = subject.trim().length > 0 && (hasStagedFiles || amend);

  return (
    <div className="commit-panel">
      <div className="panel-header">
        <span className="panel-title">Commit</span>
        <label className="amend-toggle">
          <input type="checkbox" checked={amend} onChange={handleAmendToggle} />
          <span>Amend</span>
        </label>
      </div>
      <div className="commit-form">
        <div className="commit-input-group">
          <input
            type="text"
            className="commit-subject"
            placeholder="Commit message (subject)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCommit) {
                handleCommit();
              }
            }}
          />
          <button
            type="button"
            className="ai-generate-btn"
            title="Generate with AI"
            onClick={handleAiGenerate}
            disabled={!hasStagedFiles || generating}
          >
            {generating ? (
              <div className="ai-spinner" />
            ) : (
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Z" />
              </svg>
            )}
          </button>
        </div>
        <textarea
          className="commit-body"
          placeholder="Description (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="commit-actions">
          <button
            type="button"
            className="ai-review-btn"
            onClick={handleAiReview}
            disabled={!hasChanges || reviewing}
          >
            {reviewing ? (
              <div className="ai-spinner" />
            ) : (
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Z" />
              </svg>
            )}
            AI Review
          </button>
          <Button
            variant="primary"
            onClick={handleCommit}
            disabled={!canCommit}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
            {amend ? "Amend" : "Commit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
