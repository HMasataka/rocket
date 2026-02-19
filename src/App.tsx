import { useEffect } from "react";
import { AppShell } from "./components/templates/AppShell";
import { ToastContainer } from "./components/organisms/ToastContainer";
import { ChangesPage } from "./pages/changes";
import { useGitStore } from "./stores/gitStore";
import { useUIStore } from "./stores/uiStore";

export function App() {
  const status = useGitStore((s) => s.status);
  const currentBranch = useGitStore((s) => s.currentBranch);
  const fetchBranch = useGitStore((s) => s.fetchBranch);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    fetchBranch().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchBranch, addToast]);

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
