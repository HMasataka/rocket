import { useCallback, useEffect } from "react";
import { PullDialog } from "./components/organisms/PullDialog";
import { RemoteModal } from "./components/organisms/RemoteModal";
import { SettingsModal } from "./components/organisms/SettingsModal";
import { TagsModal } from "./components/organisms/TagsModal";
import { ToastContainer } from "./components/organisms/ToastContainer";
import { AppShell } from "./components/templates/AppShell";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { useTheme } from "./hooks/useTheme";
import { BlamePage } from "./pages/blame";
import { BranchesPage } from "./pages/branches";
import { ChangesPage } from "./pages/changes";
import { CherryPickPage } from "./pages/cherry-pick";
import { ConflictModal } from "./pages/conflict";
import { FileHistoryPage } from "./pages/file-history";
import { HistoryPage } from "./pages/history";
import { HostingPage } from "./pages/hosting";
import { RebasePage } from "./pages/rebase";
import { RevertPage } from "./pages/revert";
import { StashPage } from "./pages/stash";
import type { PullOption } from "./services/git";
import { useConfigStore } from "./stores/configStore";
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
  const merging = useGitStore((s) => s.merging);
  const rebasing = useGitStore((s) => s.rebasing);
  const fetchMergeState = useGitStore((s) => s.fetchMergeState);
  const fetchRebaseState = useGitStore((s) => s.fetchRebaseState);
  const fetchCherryPickState = useGitStore((s) => s.fetchCherryPickState);
  const fetchRevertState = useGitStore((s) => s.fetchRevertState);
  const fetchStashes = useGitStore((s) => s.fetchStashes);
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const addToast = useUIStore((s) => s.addToast);
  const activePage = useUIStore((s) => s.activePage);
  const activeModal = useUIStore((s) => s.activeModal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  useTheme();

  useEffect(() => {
    loadConfig().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchBranch().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchRemotes().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchStashes().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchMergeState().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchRebaseState().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchCherryPickState().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchRevertState().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [
    loadConfig,
    fetchBranch,
    fetchRemotes,
    fetchStashes,
    fetchMergeState,
    fetchRebaseState,
    fetchCherryPickState,
    fetchRevertState,
    addToast,
  ]);

  const handleRepoChanged = useCallback(() => {
    fetchStatus().catch((e: unknown) => {
      console.error("Auto-refresh status failed:", e);
    });
    fetchBranch().catch((e: unknown) => {
      console.error("Auto-refresh branch failed:", e);
    });
    fetchMergeState().catch((e: unknown) => {
      console.error("Auto-refresh merge state failed:", e);
    });
    fetchRebaseState().catch((e: unknown) => {
      console.error("Auto-refresh rebase state failed:", e);
    });
    fetchCherryPickState().catch((e: unknown) => {
      console.error("Auto-refresh cherry-pick state failed:", e);
    });
    fetchRevertState().catch((e: unknown) => {
      console.error("Auto-refresh revert state failed:", e);
    });
  }, [
    fetchStatus,
    fetchBranch,
    fetchMergeState,
    fetchRebaseState,
    fetchCherryPickState,
    fetchRevertState,
  ]);

  useFileWatcher(handleRepoChanged);

  const defaultRemote = remotes.length > 0 ? remotes[0].name : null;

  const handleFetch = useCallback(async () => {
    if (!defaultRemote) return;
    try {
      await fetchRemote(defaultRemote);
      addToast(`Fetched from '${defaultRemote}'`, "success");
      await fetchBranch();
    } catch (e: unknown) {
      addToast(`Fetch failed: ${String(e)}`, "error");
    }
  }, [defaultRemote, fetchRemote, addToast, fetchBranch]);

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
      await fetchBranch();
    } catch (e: unknown) {
      addToast(`Push failed: ${String(e)}`, "error");
    }
  }, [defaultRemote, pushRemote, addToast, fetchBranch]);

  const changesCount = status?.files.length ?? 0;

  return (
    <>
      <AppShell
        branch={currentBranch}
        merging={merging}
        rebasing={rebasing}
        changesCount={changesCount}
        hasRemotes={remotes.length > 0}
        remotes={remotes}
        onFetch={handleFetch}
        onPull={() => openModal("pull")}
        onPush={handlePush}
        onTags={() => openModal("tags")}
        onRemote={() => openModal("remotes")}
      >
        {activePage === "changes" && <ChangesPage />}
        {activePage === "branches" && <BranchesPage />}
        {activePage === "history" && <HistoryPage />}
        {activePage === "blame" && <BlamePage />}
        {activePage === "file-history" && <FileHistoryPage />}
        {activePage === "stash" && <StashPage />}
        {activePage === "rebase" && <RebasePage />}
        {activePage === "cherry-pick" && <CherryPickPage />}
        {activePage === "revert" && <RevertPage />}
        {activePage === "hosting" && <HostingPage />}
      </AppShell>
      <ToastContainer />
      {activeModal === "remotes" && <RemoteModal onClose={closeModal} />}
      {activeModal === "tags" && <TagsModal onClose={closeModal} />}
      {activeModal === "pull" && defaultRemote && (
        <PullDialog
          remoteName={defaultRemote}
          onConfirm={handlePull}
          onClose={closeModal}
        />
      )}
      {activeModal === "conflict" && <ConflictModal />}
      {activeModal === "settings" && <SettingsModal onClose={closeModal} />}
    </>
  );
}
