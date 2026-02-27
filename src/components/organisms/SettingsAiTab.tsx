import {
  type ChangeEvent,
  type DragEvent,
  type FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CommitMessageStyle, Language } from "../../services/ai";
import { useAiStore } from "../../stores/aiStore";
import { useUIStore } from "../../stores/uiStore";
import {
  findFirstAvailableIndex,
  sortAdaptersByPriority,
} from "./providerPriority";

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

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragSourceIndex = useRef<number | null>(null);

  const sortedAdapters = useMemo(
    () => sortAdaptersByPriority(adapters, config?.provider_priority ?? []),
    [adapters, config?.provider_priority],
  );

  const firstAvailableIndex = useMemo(
    () => findFirstAvailableIndex(sortedAdapters),
    [sortedAdapters],
  );

  const handleDragStart = useCallback((index: number) => {
    dragSourceIndex.current = index;
    setDraggingIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLLIElement>, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      setDragOverIndex(null);
      const sourceIndex = dragSourceIndex.current;
      dragSourceIndex.current = null;
      if (sourceIndex === null || sourceIndex === targetIndex) return;
      if (!config) return;

      const names = sortedAdapters.map((a) => a.name);
      const [moved] = names.splice(sourceIndex, 1);
      names.splice(targetIndex, 0, moved);

      saveConfig({ ...config, provider_priority: names }).catch(
        (err: unknown) => {
          addToast(String(err), "error");
        },
      );
    },
    [config, sortedAdapters, saveConfig, addToast],
  );

  const handleDragEnd = useCallback(() => {
    dragSourceIndex.current = null;
    setDragOverIndex(null);
    setDraggingIndex(null);
  }, []);

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

  const [excludePatternsLocal, setExcludePatternsLocal] = useState("");

  useEffect(() => {
    if (config) {
      setExcludePatternsLocal(config.exclude_patterns.join(", "));
    }
  }, [config]);

  const handlePreferLocalLlmToggle = useCallback(() => {
    if (!config) return;
    saveConfig({ ...config, prefer_local_llm: !config.prefer_local_llm }).catch(
      (err: unknown) => {
        addToast(String(err), "error");
      },
    );
  }, [config, saveConfig, addToast]);

  const handleExcludePatternsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setExcludePatternsLocal(e.target.value);
    },
    [],
  );

  const handleExcludePatternsBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      if (!config) return;
      const patterns = e.target.value
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      saveConfig({ ...config, exclude_patterns: patterns }).catch(
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
        <h3>Provider Priority</h3>
        <div className="settings-hint">
          Drag to reorder. The highest available provider is used for AI
          requests.
        </div>
        <ol className="provider-priority-list">
          {sortedAdapters.map((adapter, index) => (
            <li
              key={adapter.name}
              className={`provider-priority-item${index === firstAvailableIndex ? " active" : ""}${draggingIndex === index ? " dragging" : ""}${dragOverIndex === index ? " drag-over" : ""}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              <span className="provider-priority-num">{index + 1}</span>
              <span className="provider-priority-name">{adapter.name}</span>
              <span className="provider-priority-desc">{adapter.command}</span>
              <span
                className={`provider-priority-status ${adapter.available ? "available" : "unavailable"}`}
              >
                {adapter.available ? "Detected" : "Not found"}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="settings-section">
        <h3>LLM CLI Adapters</h3>
        <div className="settings-hint">
          CLI tools detected in PATH. Per-feature assignment available.
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
        <div className="setting-row">
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

      <div className="settings-section">
        <h3>Privacy</h3>
        <div className="settings-toggle-row">
          <label htmlFor="prefer-local-llm-toggle">Prefer Local LLM</label>
          <button
            id="prefer-local-llm-toggle"
            type="button"
            className={`settings-toggle${config?.prefer_local_llm ? " active" : ""}`}
            onClick={handlePreferLocalLlmToggle}
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>
        <div className="setting-row">
          <label htmlFor="exclude-patterns-input">Exclude Patterns</label>
          <input
            id="exclude-patterns-input"
            type="text"
            className="settings-input"
            value={excludePatternsLocal}
            onChange={handleExcludePatternsChange}
            onBlur={handleExcludePatternsBlur}
            placeholder="Glob patterns to exclude"
          />
        </div>
        <div className="settings-hint">
          Files matching these patterns will never be sent to external AI
          providers.
        </div>
      </div>
    </div>
  );
}
