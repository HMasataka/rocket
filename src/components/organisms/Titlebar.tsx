import { getCurrentWindow } from "@tauri-apps/api/window";

export function Titlebar() {
  const appWindow = getCurrentWindow();

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="window-controls">
        <button
          type="button"
          className="window-dot close"
          aria-label="Close"
          onClick={() => appWindow.close()}
        />
        <button
          type="button"
          className="window-dot minimize"
          aria-label="Minimize"
          onClick={() => appWindow.minimize()}
        />
        <button
          type="button"
          className="window-dot maximize"
          aria-label="Maximize"
          onClick={() => appWindow.toggleMaximize()}
        />
      </div>
      <span className="titlebar-title" data-tauri-drag-region>
        Rocket
      </span>
    </div>
  );
}
