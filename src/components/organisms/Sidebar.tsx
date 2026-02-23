import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";

interface SidebarProps {
  changesCount: number;
}

export function Sidebar({ changesCount }: SidebarProps) {
  const activePage = useUIStore((s) => s.activePage);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const stashCount = useGitStore((s) => s.stashes.length);

  return (
    <nav className="sidebar">
      <div className="sidebar-section">
        <div className="section-label">Workspace</div>
        <button
          type="button"
          className={`nav-item${activePage === "changes" ? " active" : ""}`}
          onClick={() => setActivePage("changes")}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            role="img"
            aria-label="Changes"
          >
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
          </svg>
          Changes
          {changesCount > 0 && (
            <span className="nav-badge">{changesCount}</span>
          )}
        </button>
        <button
          type="button"
          className={`nav-item${activePage === "history" ? " active" : ""}`}
          onClick={() => setActivePage("history")}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            role="img"
            aria-label="History"
          >
            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zM8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z" />
            <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z" />
          </svg>
          History
        </button>
      </div>
      <div className="sidebar-section">
        <div className="section-label">Branches</div>
        <button
          type="button"
          className={`nav-item${activePage === "branches" ? " active" : ""}`}
          onClick={() => setActivePage("branches")}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            role="img"
            aria-label="Branches"
          >
            <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z" />
          </svg>
          Branches
        </button>
        <button
          type="button"
          className={`nav-item${activePage === "stash" ? " active" : ""}`}
          onClick={() => setActivePage("stash")}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            role="img"
            aria-label="Stash"
          >
            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h11A1.5 1.5 0 0 1 15 3.5v1A1.5 1.5 0 0 1 13.5 6h-11A1.5 1.5 0 0 1 1 4.5v-1zM2.5 3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11zm0 4A1.5 1.5 0 0 0 1 8.5v1A1.5 1.5 0 0 0 2.5 11h11A1.5 1.5 0 0 0 15 9.5v-1A1.5 1.5 0 0 0 13.5 7h-11zm0 1h11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
          </svg>
          Stash
          {stashCount > 0 && <span className="nav-badge">{stashCount}</span>}
        </button>
      </div>
    </nav>
  );
}
