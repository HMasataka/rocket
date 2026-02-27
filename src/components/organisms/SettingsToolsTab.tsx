import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import type { AppConfig, ToolsConfig } from "../../services/config";
import { useConfigStore } from "../../stores/configStore";
import { useUIStore } from "../../stores/uiStore";

export function SettingsToolsTab() {
  const config = useConfigStore((s) => s.config);
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const saveConfig = useConfigStore((s) => s.saveConfig);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    loadConfig().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [loadConfig, addToast]);

  const tools = config?.tools;

  const updateTools = useCallback(
    (partial: Partial<ToolsConfig>) => {
      if (!config || !tools) return;
      const updated: AppConfig = {
        ...config,
        tools: { ...tools, ...partial },
      };
      saveConfig(updated).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [config, tools, saveConfig, addToast],
  );

  const [gitPathLocal, setGitPathLocal] = useState("");

  useEffect(() => {
    if (tools) {
      setGitPathLocal(tools.git_path);
    }
  }, [tools]);

  if (!tools) return null;

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h3>Diff Tool</h3>
        <div className="setting-row">
          <label htmlFor="diff-tool">External Diff Tool</label>
          <select
            id="diff-tool"
            className="modal-select"
            value={tools.diff_tool}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateTools({ diff_tool: e.target.value })
            }
          >
            <option value="builtin">Built-in</option>
            <option value="vscode">VS Code</option>
            <option value="meld">Meld</option>
            <option value="kaleidoscope">Kaleidoscope</option>
            <option value="beyond-compare">Beyond Compare</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Merge Tool</h3>
        <div className="setting-row">
          <label htmlFor="merge-tool">External Merge Tool</label>
          <select
            id="merge-tool"
            className="modal-select"
            value={tools.merge_tool}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateTools({ merge_tool: e.target.value })
            }
          >
            <option value="builtin">Built-in</option>
            <option value="vscode">VS Code</option>
            <option value="meld">Meld</option>
            <option value="kaleidoscope">Kaleidoscope</option>
            <option value="beyond-compare">Beyond Compare</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Terminal</h3>
        <div className="setting-row">
          <label htmlFor="terminal">Terminal Emulator</label>
          <select
            id="terminal"
            className="modal-select"
            value={tools.terminal}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateTools({ terminal: e.target.value })
            }
          >
            <option value="default">System Default</option>
            <option value="iterm">iTerm2</option>
            <option value="warp">Warp</option>
            <option value="alacritty">Alacritty</option>
            <option value="kitty">Kitty</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Editor</h3>
        <div className="setting-row">
          <label htmlFor="editor">External Editor</label>
          <select
            id="editor"
            className="modal-select"
            value={tools.editor}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateTools({ editor: e.target.value })
            }
          >
            <option value="vscode">VS Code</option>
            <option value="cursor">Cursor</option>
            <option value="zed">Zed</option>
            <option value="sublime">Sublime Text</option>
            <option value="vim">Vim</option>
            <option value="neovim">Neovim</option>
          </select>
        </div>
        <div className="settings-toggle-row" style={{ marginTop: 8 }}>
          <label htmlFor="open-on-double-click">
            Open in Editor on double-click
          </label>
          <button
            id="open-on-double-click"
            type="button"
            className={`settings-toggle${tools.open_in_editor_on_double_click ? " active" : ""}`}
            onClick={() =>
              updateTools({
                open_in_editor_on_double_click:
                  !tools.open_in_editor_on_double_click,
              })
            }
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Git</h3>
        <div className="setting-row">
          <label htmlFor="git-path">Git Path</label>
          <div className="settings-input-row">
            <input
              id="git-path"
              type="text"
              className="settings-input"
              value={gitPathLocal}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setGitPathLocal(e.target.value)
              }
              onBlur={() => updateTools({ git_path: gitPathLocal })}
              placeholder="Path to git binary"
            />
          </div>
        </div>
        <div className="settings-toggle-row" style={{ marginTop: 8 }}>
          <label htmlFor="auto-fetch-on-open">Auto-fetch on open</label>
          <button
            id="auto-fetch-on-open"
            type="button"
            className={`settings-toggle${tools.auto_fetch_on_open ? " active" : ""}`}
            onClick={() =>
              updateTools({ auto_fetch_on_open: !tools.auto_fetch_on_open })
            }
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>
        <div className="setting-row" style={{ marginTop: 8 }}>
          <label htmlFor="auto-fetch-interval">Auto-fetch Interval</label>
          <select
            id="auto-fetch-interval"
            className="modal-select"
            value={tools.auto_fetch_interval}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateTools({ auto_fetch_interval: Number(e.target.value) })
            }
          >
            <option value={0}>Disabled</option>
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
            <option value={600}>10 minutes</option>
            <option value={1800}>30 minutes</option>
          </select>
        </div>
      </div>
    </div>
  );
}
