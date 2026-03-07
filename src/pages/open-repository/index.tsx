import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect } from "react";
import { useRepoStore } from "../../stores/repoStore";
import { useTabStore } from "../../stores/tabStore";
import { useUIStore } from "../../stores/uiStore";
import { RecentRepoList } from "./organisms/RecentRepoList";

export function OpenRepositoryPage() {
  const recentRepos = useRepoStore((s) => s.recentRepos);
  const fetchRecentRepos = useRepoStore((s) => s.fetchRecentRepos);
  const openTab = useTabStore((s) => s.openTab);
  const addToast = useUIStore((s) => s.addToast);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const openModal = useUIStore((s) => s.openModal);

  useEffect(() => {
    fetchRecentRepos().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchRecentRepos, addToast]);

  const handleOpenFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;
    try {
      await openTab(selected);
      setActivePage("changes");
    } catch (e: unknown) {
      addToast(`Failed to open repository: ${String(e)}`, "error");
    }
  }, [openTab, setActivePage, addToast]);

  const handleSelectRepo = useCallback(
    async (path: string) => {
      try {
        await openTab(path);
        setActivePage("changes");
      } catch (e: unknown) {
        addToast(`Failed to open repository: ${String(e)}`, "error");
      }
    },
    [openTab, setActivePage, addToast],
  );

  const handleClone = useCallback(() => {
    openModal("clone");
  }, [openModal]);

  const handleInit = useCallback(() => {
    openModal("init");
  }, [openModal]);

  return (
    <div className="newtab-page">
      <div className="newtab-content">
        <div className="newtab-header">
          <h1 className="newtab-title">Open Repository</h1>
          <p className="newtab-desc">
            Select a recent repository or open a new one
          </p>
        </div>

        <div className="newtab-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenFolder}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-10Z" />
            </svg>
            Open Folder
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClone}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z" />
              <path d="M11.285 9.458l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 5.671A3 3 0 0 0 7.414 10.5l.586-.586a1.002 1.002 0 0 0 .154-.199 2 2 0 0 1-.861-3.337L9.12 4.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287z" />
            </svg>
            Clone
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleInit}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            Init
          </button>
        </div>

        <RecentRepoList repos={recentRepos} onSelect={handleSelectRepo} />
      </div>
    </div>
  );
}
