interface ToolbarProps {
  branch: string | null;
  defaultRemoteName: string | null;
  onFetch: () => void;
  onPull: () => void;
  onPush: () => void;
  onTags?: () => void;
  onRemote: () => void;
  disabled: boolean;
}

export function Toolbar({
  branch,
  defaultRemoteName,
  onFetch,
  onPull,
  onPush,
  onTags,
  onRemote,
  disabled,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <div className="branch-selector">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z" />
          </svg>
          <span>{branch ?? "detached"}</span>
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="chevron"
            aria-hidden="true"
          >
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
          </svg>
        </div>
      </div>
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onFetch}
          disabled={disabled}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
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
            <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
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
            <path d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
          </svg>
          <span>Push</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onTags}
          title="Tags"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
          </svg>
          <span>Tags</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn remote-btn"
          onClick={onRemote}
          title="Remote"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z" />
            <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z" />
          </svg>
          <span>{defaultRemoteName ?? "Remote"}</span>
          <svg
            className="dropdown-arrow"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      </div>
      <div className="toolbar-spacer" />
    </div>
  );
}
