import { useCallback, useEffect } from "react";
import { PullDialog } from "./components/organisms/PullDialog";
import { RemoteModal } from "./components/organisms/RemoteModal";
import { ToastContainer } from "./components/organisms/ToastContainer";
import { AppShell } from "./components/templates/AppShell";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { BranchesPage } from "./pages/branches";
import { ChangesPage } from "./pages/changes";
import type { PullOption } from "./services/git";
import { useGitStore } from "./stores/gitStore";
import { useUIStore } from "./stores/uiStore";

export function App() {
  const status = useGitStore((s) => s.status);
  const currentBranch = useGitStore((s) => s.currentBranch);
  const remotes = useGitStore((s) => s.remotes);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const fetchBranch = useGitStore((s) => s.fetchBranch);
  const fetchRemotes = useGitStore((s) => s.fetchRemotes);
  const fetchRemote = useGitStore((s) => s.fetchRemote);
  const pullRemote = useGitStore((s) => s.pullRemote);
  const pushRemote = useGitStore((s) => s.pushRemote);
  const addToast = useUIStore((s) => s.addToast);
  const activePage = useUIStore((s) => s.activePage);
  const activeModal = useUIStore((s) => s.activeModal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  useEffect(() => {
    fetchBranch().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchRemotes().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchBranch, fetchRemotes, addToast]);

  const handleRepoChanged = useCallback(() => {
    fetchStatus().catch((e: unknown) => {
      console.error("Auto-refresh status failed:", e);
    });
    fetchBranch().catch((e: unknown) => {
      console.error("Auto-refresh branch failed:", e);
    });
  }, [fetchStatus, fetchBranch]);

  useFileWatcher(handleRepoChanged);

  const defaultRemote = remotes.length > 0 ? remotes[0].name : null;

  const handleFetch = useCallback(async () => {
    if (!defaultRemote) return;
    try {
      await fetchRemote(defaultRemote);
      addToast(`Fetched from '${defaultRemote}'`, "success");
    } catch (e: unknown) {
      addToast(`Fetch failed: ${String(e)}`, "error");
    }
  }, [defaultRemote, fetchRemote, addToast]);

  const handlePull = useCallback(
    async (option: PullOption) => {
      if (!defaultRemote) return;
      try {
        const result = await pullRemote(defaultRemote, option);
        addToast(`Pull ${result.kind}: ${defaultRemote}`, "success");
        closeModal();
        await fetchStatus();
        await fetchBranch();
      } catch (e: unknown) {
        addToast(`Pull failed: ${String(e)}`, "error");
      }
    },
    [defaultRemote, pullRemote, addToast, closeModal, fetchStatus, fetchBranch],
  );

  const handlePush = useCallback(async () => {
    if (!defaultRemote) return;
    try {
      const result = await pushRemote(defaultRemote);
      addToast(
        `Pushed '${result.branch}' to '${result.remote_name}'`,
        "success",
      );
    } catch (e: unknown) {
      addToast(`Push failed: ${String(e)}`, "error");
    }
  }, [defaultRemote, pushRemote, addToast]);

  const changesCount = status?.files.length ?? 0;

  return (
    <>
      <AppShell
        branch={currentBranch}
        changesCount={changesCount}
        hasRemotes={remotes.length > 0}
        onFetch={handleFetch}
        onPull={() => openModal("pull")}
        onPush={handlePush}
        onRemote={() => openModal("remotes")}
      >
        {activePage === "changes" && <ChangesPage />}
        {activePage === "branches" && <BranchesPage />}
      </AppShell>
      <ToastContainer />
      {activeModal === "remotes" && <RemoteModal onClose={closeModal} />}
      {activeModal === "pull" && defaultRemote && (
        <PullDialog
          remoteName={defaultRemote}
          onConfirm={handlePull}
          onClose={closeModal}
        />
      )}
    </>
  );
}
