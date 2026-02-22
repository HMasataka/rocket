import { useUIStore } from "../../stores/uiStore";

interface SidebarProps {
  changesCount: number;
}

export function Sidebar({ changesCount }: SidebarProps) {
  const activePage = useUIStore((s) => s.activePage);
  const setActivePage = useUIStore((s) => s.setActivePage);

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
      </div>
    </nav>
  );
}
