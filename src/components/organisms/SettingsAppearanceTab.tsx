import { type ChangeEvent, useCallback, useEffect } from "react";
import { useConfigStore } from "../../stores/configStore";
import { useUIStore } from "../../stores/uiStore";

const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
] as const;

const COLOR_THEMES = [
  { value: "cobalt", color: "#58a6ff" },
  { value: "emerald", color: "#34d399" },
  { value: "rose", color: "#f472b6" },
  { value: "amber", color: "#f59e0b" },
  { value: "slate", color: "#a5a5b4" },
  { value: "violet", color: "#a78bfa" },
] as const;

export function SettingsAppearanceTab() {
  const config = useConfigStore((s) => s.config);
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const updateAppearance = useConfigStore((s) => s.updateAppearance);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    loadConfig().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [loadConfig, addToast]);

  const appearance = config?.appearance;

  const handleThemeChange = useCallback(
    (theme: string) => {
      if (!appearance) return;
      updateAppearance({ ...appearance, theme }).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [appearance, updateAppearance, addToast],
  );

  const handleColorThemeChange = useCallback(
    (colorTheme: string) => {
      if (!appearance) return;
      updateAppearance({ ...appearance, color_theme: colorTheme }).catch(
        (e: unknown) => {
          addToast(String(e), "error");
        },
      );
    },
    [appearance, updateAppearance, addToast],
  );

  const handleFontSizeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!appearance) return;
      updateAppearance({
        ...appearance,
        ui_font_size: Number(e.target.value),
      }).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [appearance, updateAppearance, addToast],
  );

  const handleSidebarPositionChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!appearance) return;
      updateAppearance({
        ...appearance,
        sidebar_position: e.target.value,
      }).catch((e: unknown) => {
        addToast(String(e), "error");
      });
    },
    [appearance, updateAppearance, addToast],
  );

  const handleTabStyleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!appearance) return;
      updateAppearance({ ...appearance, tab_style: e.target.value }).catch(
        (e: unknown) => {
          addToast(String(e), "error");
        },
      );
    },
    [appearance, updateAppearance, addToast],
  );

  if (!appearance) return null;

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h3>Theme</h3>
        <div className="theme-selector">
          {THEMES.map((t) => (
            <label
              key={t.value}
              className={`theme-option${appearance.theme === t.value ? " selected" : ""}`}
            >
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={appearance.theme === t.value}
                onChange={() => handleThemeChange(t.value)}
              />
              <span className={`theme-preview ${t.value}`} />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Color Theme</h3>
        <div className="color-picker">
          {COLOR_THEMES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              className={`color-option${appearance.color_theme === ct.value ? " selected" : ""}`}
              style={{ "--color": ct.color } as React.CSSProperties}
              onClick={() => handleColorThemeChange(ct.value)}
              title={ct.value}
            />
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Font Size</h3>
        <div className="setting-row">
          <label htmlFor="ui-font-size">UI</label>
          <input
            id="ui-font-size"
            type="range"
            min={10}
            max={18}
            value={appearance.ui_font_size}
            onChange={handleFontSizeChange}
          />
          <span>{appearance.ui_font_size}px</span>
        </div>
      </div>

      <div className="settings-section">
        <h3>Layout</h3>
        <div className="setting-row">
          <label htmlFor="sidebar-position">Sidebar Position</label>
          <select
            id="sidebar-position"
            className="modal-select"
            value={appearance.sidebar_position}
            onChange={handleSidebarPositionChange}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="setting-row" style={{ marginTop: 8 }}>
          <label htmlFor="tab-style">Tab Style</label>
          <select
            id="tab-style"
            className="modal-select"
            value={appearance.tab_style}
            onChange={handleTabStyleChange}
          >
            <option value="default">Default</option>
            <option value="compact">Compact</option>
          </select>
        </div>
      </div>
    </div>
  );
}
