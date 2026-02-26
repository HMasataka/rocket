import {
  type ChangeEvent,
  type DragEvent,
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
    (e: DragEvent<HTMLDivElement>, index: number) => {
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
    </div>
  );
}
