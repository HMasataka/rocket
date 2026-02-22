interface ToolbarProps {
  onFetch: () => void;
  onPull: () => void;
  onPush: () => void;
  onRemote: () => void;
  disabled: boolean;
}

export function Toolbar({
  onFetch,
  onPull,
  onPush,
  onRemote,
  disabled,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onFetch}
          disabled={disabled}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a.75.75 0 0 1 .75.75v6.19l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 1.06-1.06l1.72 1.72V1.75A.75.75 0 0 1 8 1zM3.5 10a.75.75 0 0 1 .75.75v2.5h7.5v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 11.5 15h-7A1.75 1.75 0 0 1 2.75 13.25v-2.5A.75.75 0 0 1 3.5 10z" />
          </svg>
          <span>Fetch</span>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={onPull}
          disabled={disabled}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 12a.75.75 0 0 1-.53-.22l-3.5-3.5a.75.75 0 0 1 1.06-1.06L8 10.19l2.97-2.97a.75.75 0 1 1 1.06 1.06l-3.5 3.5A.75.75 0 0 1 8 12z" />
            <path d="M8 1a.75.75 0 0 1 .75.75v9.5a.75.75 0 0 1-1.5 0v-9.5A.75.75 0 0 1 8 1z" />
            <path d="M2.75 14a.75.75 0 0 1 0-1.5h10.5a.75.75 0 0 1 0 1.5H2.75z" />
          </svg>
          <span>Pull</span>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={onPush}
          disabled={disabled}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 4a.75.75 0 0 1 .53.22l3.5 3.5a.75.75 0 0 1-1.06 1.06L8 5.81 5.03 8.78a.75.75 0 0 1-1.06-1.06l3.5-3.5A.75.75 0 0 1 8 4z" />
            <path d="M8 15a.75.75 0 0 1-.75-.75v-9.5a.75.75 0 0 1 1.5 0v9.5A.75.75 0 0 1 8 15z" />
            <path d="M2.75 3a.75.75 0 0 1 0-1.5h10.5a.75.75 0 0 1 0 1.5H2.75z" />
          </svg>
          <span>Push</span>
        </button>
      </div>
      <div className="toolbar-spacer" />
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn remote-btn"
          onClick={onRemote}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M1 2.5A2.5 2.5 0 0 1 3.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 1 11.5v-9z" />
          </svg>
          <span>Remotes</span>
        </button>
      </div>
    </div>
  );
}
