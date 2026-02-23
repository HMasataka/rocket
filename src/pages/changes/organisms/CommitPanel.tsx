import { useCallback, useState } from "react";
import { Button } from "../../../components/atoms/Button";

interface CommitPanelProps {
  onCommit: (message: string, amend: boolean) => void;
  hasStagedFiles: boolean;
  onLoadHeadMessage?: () => Promise<string>;
}

export function CommitPanel({
  onCommit,
  hasStagedFiles,
  onLoadHeadMessage,
}: CommitPanelProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [amend, setAmend] = useState(false);

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
    }
  }, [amend, onLoadHeadMessage]);

  const canCommit = subject.trim().length > 0 && (hasStagedFiles || amend);

  return (
    <div className="commit-panel">
      <div className="panel-header">
        <span className="panel-title">Commit</span>
      </div>
      <div className="commit-form">
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
        <textarea
          className="commit-body"
          placeholder="Description (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="commit-actions">
          <label className="amend-toggle">
            <input
              type="checkbox"
              checked={amend}
              onChange={handleAmendToggle}
            />
            <span>Amend</span>
          </label>
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
