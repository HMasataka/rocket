import { type ChangeEvent, useCallback, useEffect } from "react";
import type { CommitMessageStyle, Language } from "../../services/ai";
import { useAiStore } from "../../stores/aiStore";
import { useUIStore } from "../../stores/uiStore";

export function SettingsAiTab() {
  const adapters = useAiStore((s) => s.adapters);
  const config = useAiStore((s) => s.config);
  const fetchConfig = useAiStore((s) => s.fetchConfig);
  const saveConfig = useAiStore((s) => s.saveConfig);
  const detectAdapters = useAiStore((s) => s.detectAdapters);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    fetchConfig().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    detectAdapters().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchConfig, detectAdapters, addToast]);

  const handleStyleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!config) return;
      const style = e.target.value as CommitMessageStyle;
      saveConfig({ ...config, commit_message_style: style }).catch(
        (err: unknown) => {
          addToast(String(err), "error");
        },
      );
    },
    [config, saveConfig, addToast],
  );

  const handleLanguageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!config) return;
      const language = e.target.value as Language;
      saveConfig({ ...config, commit_message_language: language }).catch(
        (err: unknown) => {
          addToast(String(err), "error");
        },
      );
    },
    [config, saveConfig, addToast],
  );

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h3>LLM CLI Adapters</h3>
        <div className="settings-hint" style={{ marginBottom: 10 }}>
          CLI tools detected in PATH.
        </div>
        <div className="cli-adapter-list">
          {adapters.map((adapter) => (
            <div key={adapter.name} className="cli-adapter-item">
              <div className="cli-adapter-info">
                <span className="cli-adapter-name">{adapter.name}</span>
                <code className="cli-adapter-cmd">{adapter.command}</code>
              </div>
              <span
                className={`provider-priority-status ${adapter.available ? "available" : "unavailable"}`}
              >
                {adapter.available ? "Detected" : "Not found"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Commit Message</h3>
        <div className="setting-row">
          <label htmlFor="commit-style-select">Style</label>
          <select
            id="commit-style-select"
            className="modal-select"
            value={config?.commit_message_style ?? "conventional"}
            onChange={handleStyleChange}
          >
            <option value="conventional">Conventional Commits</option>
            <option value="simple">Simple</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <div className="setting-row" style={{ marginTop: 8 }}>
          <label htmlFor="commit-language-select">Language</label>
          <select
            id="commit-language-select"
            className="modal-select"
            value={config?.commit_message_language ?? "en"}
            onChange={handleLanguageChange}
          >
            <option value="en">English</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
      </div>
    </div>
  );
}
