import { getCurrentWindow } from "@tauri-apps/api/window";
import { type DragEvent, useCallback, useState } from "react";
import { useTabStore } from "../../stores/tabStore";
import { useUIStore } from "../../stores/uiStore";

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

function TabCloseIcon() {
  return (
    <svg
      viewBox="0 0 8 8"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 2v10M2 7h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Titlebar() {
  const appWindow = getCurrentWindow();
  const openModal = useUIStore((s) => s.openModal);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const closeTab = useTabStore((s) => s.closeTab);
  const reorderTabs = useTabStore((s) => s.reorderTabs);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLButtonElement>, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLButtonElement>, toIndex: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== toIndex) {
        reorderTabs(dragIndex, toIndex);
      }
      setDragIndex(null);
    },
    [dragIndex, reorderTabs],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleAddTab = useCallback(() => {
    setActivePage("open-repository");
  }, [setActivePage]);

  const handleTabClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      closeTab(tabId);
    },
    [closeTab],
  );

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
      {tabs.length > 0 ? (
        <div className="titlebar-tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              className={`tab${tab.id === activeTabId ? " active" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
              {tabs.length > 1 && (
                <button
                  type="button"
                  className="tab-close"
                  tabIndex={-1}
                  onClick={(e) => handleTabClose(e, tab.id)}
                >
                  <TabCloseIcon />
                </button>
              )}
            </button>
          ))}
          <button
            type="button"
            className="tab tab-add"
            aria-label="Open Repository"
            onClick={handleAddTab}
          >
            <PlusIcon />
          </button>
        </div>
      ) : (
        <span className="titlebar-title" data-tauri-drag-region>
          Rocket
        </span>
      )}
      <div className="titlebar-actions">
        <button
          type="button"
          className="icon-btn"
          aria-label="Settings"
          title="Settings"
          onClick={() => openModal("settings")}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
