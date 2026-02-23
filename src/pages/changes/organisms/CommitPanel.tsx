import { useState } from "react";
import { Button } from "../../../components/atoms/Button";

interface CommitPanelProps {
  onCommit: (message: string, amend: boolean) => void;
  hasStagedFiles: boolean;
}

export function CommitPanel({ onCommit, hasStagedFiles }: CommitPanelProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleCommit = () => {
    const message = body.trim() ? `${subject}\n\n${body}` : subject;
    onCommit(message, false);
    setSubject("");
    setBody("");
  };

  const canCommit = subject.trim().length > 0 && hasStagedFiles;

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
          <Button
            variant="primary"
            onClick={handleCommit}
            disabled={!canCommit}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
            Commit
          </Button>
        </div>
      </div>
    </div>
  );
}
