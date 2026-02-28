import type { SubmoduleInfo } from "../../../services/submodule";
import { SubmoduleCard } from "../molecules/SubmoduleCard";

interface SubmoduleListProps {
  submodules: SubmoduleInfo[];
  onUpdate: (path: string) => void;
  onUpdateAll: () => void;
  onRemove: (path: string) => void;
}

export function SubmoduleList({
  submodules,
  onUpdate,
  onUpdateAll,
  onRemove,
}: SubmoduleListProps) {
  return (
    <div className="submodules-content">
      {submodules.length > 0 && (
        <div className="submodules-toolbar">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onUpdateAll}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
              <path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
            </svg>
            Update All
          </button>
        </div>
      )}
      <div className="submodules-list">
        {submodules.length === 0 && (
          <div className="empty-state">No submodules configured</div>
        )}
        {submodules.map((sub) => (
          <SubmoduleCard
            key={sub.path}
            submodule={sub}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
