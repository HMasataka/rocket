import { useCallback, useEffect } from "react";
import { ToastContainer } from "./components/organisms/ToastContainer";
import { AppShell } from "./components/templates/AppShell";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { ChangesPage } from "./pages/changes";
import { useGitStore } from "./stores/gitStore";
import { useUIStore } from "./stores/uiStore";

export function App() {
  const status = useGitStore((s) => s.status);
  const currentBranch = useGitStore((s) => s.currentBranch);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const fetchBranch = useGitStore((s) => s.fetchBranch);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    fetchBranch().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchBranch, addToast]);

  const handleRepoChanged = useCallback(() => {
    fetchStatus().catch((e: unknown) => {
      console.error("Auto-refresh status failed:", e);
    });
    fetchBranch().catch((e: unknown) => {
      console.error("Auto-refresh branch failed:", e);
    });
  }, [fetchStatus, fetchBranch]);

  useFileWatcher(handleRepoChanged);

  const changesCount = status?.files.length ?? 0;

  return (
    <>
      <AppShell branch={currentBranch} changesCount={changesCount}>
        <ChangesPage />
      </AppShell>
      <ToastContainer />
    </>
  );
}
