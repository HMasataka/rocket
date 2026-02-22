import { getCurrentWindow } from "@tauri-apps/api/window";

const iconColor = "rgba(77,18,10,0.85)";

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 10 10"
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"
        stroke={iconColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      viewBox="0 0 10 10"
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 5H8.5"
        stroke={iconColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg
      viewBox="0 0 10 10"
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 1.5H6.5L1.5 6.5V2.5C1.5 1.95 1.95 1.5 2.5 1.5Z"
        fill={iconColor}
      />
      <path
        d="M7.5 8.5H3.5L8.5 3.5V7.5C8.5 8.05 8.05 8.5 7.5 8.5Z"
        fill={iconColor}
      />
    </svg>
  );
}

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
        >
          <CloseIcon />
        </button>
        <button
          type="button"
          className="window-dot minimize"
          aria-label="Minimize"
          onClick={() => appWindow.minimize()}
        >
          <MinimizeIcon />
        </button>
        <button
          type="button"
          className="window-dot maximize"
          aria-label="Maximize"
          onClick={() => appWindow.toggleMaximize()}
        >
          <MaximizeIcon />
        </button>
      </div>
      <span className="titlebar-title" data-tauri-drag-region>
        Rocket
      </span>
    </div>
  );
}
