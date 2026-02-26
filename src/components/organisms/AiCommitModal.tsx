import { useCallback, useEffect, useState } from "react";
import type {
  CommitMessageStyle,
  GenerateResult,
  Language,
} from "../../services/ai";
import { useAiStore } from "../../stores/aiStore";
import { Button } from "../atoms/Button";
import { Modal } from "./Modal";

interface AiCommitModalProps {
  onUse: (subject: string, body: string) => void;
  onClose: () => void;
}

export function AiCommitModal({ onUse, onClose }: AiCommitModalProps) {
  const [format, setFormat] = useState<CommitMessageStyle>("conventional");
  const [language, setLanguage] = useState<Language>("en");
  const [configLoaded, setConfigLoaded] = useState(false);

  const generating = useAiStore((s) => s.generating);
  const lastResult = useAiStore((s) => s.lastResult);
  const error = useAiStore((s) => s.error);
  const generateCommitMessage = useAiStore((s) => s.generateCommitMessage);
  const fetchConfig = useAiStore((s) => s.fetchConfig);
  const clearResult = useAiStore((s) => s.clearResult);
  const clearError = useAiStore((s) => s.clearError);

  useEffect(() => {
    return () => {
      clearResult();
      clearError();
    };
  }, [clearResult, clearError]);

  useEffect(() => {
    fetchConfig()
      .then(() => {
        const config = useAiStore.getState().config;
        if (config) {
          setFormat(config.commit_message_style);
          setLanguage(config.commit_message_language);
        }
        setConfigLoaded(true);
      })
      .catch(() => {
        setConfigLoaded(true);
      });
  }, [fetchConfig]);

  const handleGenerate = useCallback(() => {
    generateCommitMessage(format, language).catch(() => {
      // error is stored in the store
    });
  }, [generateCommitMessage, format, language]);

  useEffect(() => {
    if (configLoaded) {
      handleGenerate();
    }
  }, [configLoaded, handleGenerate]);

  const handleUse = useCallback(
    (result: GenerateResult) => {
      onUse(result.subject, result.body);
      onClose();
    },
    [onUse, onClose],
  );

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={() => lastResult && handleUse(lastResult)}
        disabled={!lastResult || generating}
      >
        Use
      </Button>
    </>
  );

  return (
    <Modal
      title="AI Commit Message Generator"
      onClose={onClose}
      footer={footer}
      width={550}
    >
      <div className="ai-settings-row">
        <label htmlFor="ai-format-select">Format:</label>
        <select
          id="ai-format-select"
          className="modal-select"
          value={format}
          onChange={(e) => setFormat(e.target.value as CommitMessageStyle)}
        >
          <option value="conventional">Conventional Commits</option>
          <option value="simple">Simple</option>
          <option value="detailed">Detailed</option>
        </select>
        <label htmlFor="ai-language-select">Language:</label>
        <select
          id="ai-language-select"
          className="modal-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          <option value="en">English</option>
          <option value="ja">Japanese</option>
        </select>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
        >
          Regenerate
        </Button>
      </div>

      {generating && (
        <div className="ai-generating">
          <div className="ai-spinner" />
          <span>Generating commit message...</span>
        </div>
      )}

      {error && !generating && <div className="ai-error">{error}</div>}

      {lastResult && !generating && (
        <div className="ai-result">
          <div className="ai-suggestion">
            <div className="suggestion-subject">{lastResult.subject}</div>
            {lastResult.body && (
              <div className="suggestion-body">{lastResult.body}</div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
