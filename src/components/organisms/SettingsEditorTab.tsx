import { type ChangeEvent, useCallback, useEffect } from "react";
import type { AppConfig, EditorConfig } from "../../services/config";
import { useConfigStore } from "../../stores/configStore";
import { useUIStore } from "../../stores/uiStore";

export function SettingsEditorTab() {
  const config = useConfigStore((s) => s.config);
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const saveConfig = useConfigStore((s) => s.saveConfig);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    loadConfig().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [loadConfig, addToast]);

  const editor = config?.editor;

  const updateEditor = useCallback(
    (partial: Partial<EditorConfig>) => {
      if (!config || !editor) return;
      const updated: AppConfig = {
        ...config,
        editor: { ...editor, ...partial },
      };
      saveConfig(updated).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [config, editor, saveConfig, addToast],
  );

  if (!editor) return null;

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h3>Font</h3>
        <div className="setting-row">
          <label htmlFor="editor-font-family">Font Family</label>
          <select
            id="editor-font-family"
            className="modal-select"
            value={editor.font_family}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateEditor({ font_family: e.target.value })
            }
          >
            <option value="JetBrains Mono">JetBrains Mono</option>
            <option value="Fira Code">Fira Code</option>
            <option value="Source Code Pro">Source Code Pro</option>
            <option value="Cascadia Code">Cascadia Code</option>
            <option value="Iosevka">Iosevka</option>
          </select>
        </div>
        <div className="setting-row" style={{ marginTop: 8 }}>
          <label htmlFor="editor-font-size">Font Size</label>
          <input
            id="editor-font-size"
            type="range"
            min={10}
            max={24}
            value={editor.font_size}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateEditor({ font_size: Number(e.target.value) })
            }
          />
          <span>{editor.font_size}px</span>
        </div>
        <div className="setting-row" style={{ marginTop: 8 }}>
          <label htmlFor="editor-line-height">Line Height</label>
          <input
            id="editor-line-height"
            type="range"
            min={12}
            max={30}
            value={editor.line_height}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateEditor({ line_height: Number(e.target.value) })
            }
          />
          <span>{editor.line_height}px</span>
        </div>
      </div>

      <div className="settings-section">
        <h3>Display</h3>
        <div className="settings-toggle-row">
          <label htmlFor="show-line-numbers">Show Line Numbers</label>
          <button
            id="show-line-numbers"
            type="button"
            className={`settings-toggle${editor.show_line_numbers ? " active" : ""}`}
            onClick={() =>
              updateEditor({ show_line_numbers: !editor.show_line_numbers })
            }
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>
        <div className="settings-toggle-row">
          <label htmlFor="word-wrap">Word Wrap</label>
          <button
            id="word-wrap"
            type="button"
            className={`settings-toggle${editor.word_wrap ? " active" : ""}`}
            onClick={() => updateEditor({ word_wrap: !editor.word_wrap })}
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>
        <div className="settings-toggle-row">
          <label htmlFor="show-whitespace">Show Whitespace</label>
          <button
            id="show-whitespace"
            type="button"
            className={`settings-toggle${editor.show_whitespace ? " active" : ""}`}
            onClick={() =>
              updateEditor({ show_whitespace: !editor.show_whitespace })
            }
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>
        <div className="settings-toggle-row">
          <label htmlFor="minimap">Minimap</label>
          <button
            id="minimap"
            type="button"
            className={`settings-toggle${editor.minimap ? " active" : ""}`}
            onClick={() => updateEditor({ minimap: !editor.minimap })}
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Indentation</h3>
        <div className="setting-row">
          <label htmlFor="indent-style">Indent Style</label>
          <select
            id="indent-style"
            className="modal-select"
            value={editor.indent_style}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateEditor({ indent_style: e.target.value })
            }
          >
            <option value="spaces">Spaces</option>
            <option value="tabs">Tabs</option>
          </select>
        </div>
        <div className="setting-row" style={{ marginTop: 8 }}>
          <label htmlFor="tab-size">Tab Size</label>
          <select
            id="tab-size"
            className="modal-select"
            value={editor.tab_size}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateEditor({ tab_size: Number(e.target.value) })
            }
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </div>
      </div>
    </div>
  );
}
