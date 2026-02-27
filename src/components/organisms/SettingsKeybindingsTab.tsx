import { type ChangeEvent, useCallback, useEffect } from "react";
import type { AppConfig } from "../../services/config";
import { useConfigStore } from "../../stores/configStore";
import { useUIStore } from "../../stores/uiStore";

const KEYBINDING_SECTIONS = [
  {
    title: "General",
    bindings: [
      { action: "Open Settings", key: "\u2318 ," },
      { action: "Search", key: "\u2318 F" },
      { action: "Toggle Sidebar", key: "\u2318 B" },
      { action: "New Tab", key: "\u2318 T" },
      { action: "Close Tab", key: "\u2318 W" },
    ],
  },
  {
    title: "Git Operations",
    bindings: [
      { action: "Commit", key: "\u2318 Enter" },
      { action: "Push", key: "\u2318 \u21e7 P" },
      { action: "Pull", key: "\u2318 \u21e7 L" },
      { action: "Fetch", key: "\u2318 \u21e7 F" },
      { action: "Stage All", key: "\u2318 \u21e7 A" },
      { action: "Unstage All", key: "\u2318 \u21e7 U" },
    ],
  },
  {
    title: "Navigation",
    bindings: [
      { action: "Changes", key: "\u2318 1" },
      { action: "History", key: "\u2318 2" },
      { action: "Branches", key: "\u2318 3" },
      { action: "Stash", key: "\u2318 4" },
    ],
  },
] as const;

export function SettingsKeybindingsTab() {
  const config = useConfigStore((s) => s.config);
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const saveConfig = useConfigStore((s) => s.saveConfig);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    loadConfig().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [loadConfig, addToast]);

  const keybindings = config?.keybindings;

  const handlePresetChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!config) return;
      const updated: AppConfig = {
        ...config,
        keybindings: { ...config.keybindings, preset: e.target.value },
      };
      saveConfig(updated).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [config, saveConfig, addToast],
  );

  if (!keybindings) return null;

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h3>Preset</h3>
        <div className="setting-row">
          <label htmlFor="keybinding-preset">Keybinding Preset</label>
          <select
            id="keybinding-preset"
            className="modal-select"
            value={keybindings.preset}
            onChange={handlePresetChange}
          >
            <option value="default">Default</option>
            <option value="vim">Vim</option>
            <option value="emacs">Emacs</option>
          </select>
        </div>
      </div>

      {KEYBINDING_SECTIONS.map((section) => (
        <div key={section.title} className="settings-section">
          <h3>{section.title}</h3>
          <div className="keybinding-list">
            {section.bindings.map((binding) => (
              <div key={binding.action} className="keybinding-row">
                <span className="keybinding-action">{binding.action}</span>
                <kbd className="keybinding-key">{binding.key}</kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
