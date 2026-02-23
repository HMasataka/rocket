import { useCallback, useEffect, useState } from "react";
import type { RebaseTodoEntry } from "../../services/rebase";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import "../../styles/rebase.css";
import { RebasePreview } from "./organisms/RebasePreview";
import { RebaseTodoList } from "./organisms/RebaseTodoList";

export function RebasePage() {
  const branches = useGitStore((s) => s.branches);
  const currentBranch = useGitStore((s) => s.currentBranch);
  const fetchBranches = useGitStore((s) => s.fetchBranches);
  const getRebaseTodo = useGitStore((s) => s.getRebaseTodo);
  const interactiveRebase = useGitStore((s) => s.interactiveRebase);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const fetchRebaseState = useGitStore((s) => s.fetchRebaseState);
  const addToast = useUIStore((s) => s.addToast);
  const openModal = useUIStore((s) => s.openModal);

  const [ontoBranch, setOntoBranch] = useState<string>("");
  const [entries, setEntries] = useState<RebaseTodoEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchBranches, addToast]);

  const availableBranches = branches.filter(
    (b) => b.name !== currentBranch && !b.is_remote,
  );

  const handleSelectBranch = useCallback(
    async (branch: string) => {
      setOntoBranch(branch);
      if (!branch) {
        setEntries([]);
        return;
      }
      setLoading(true);
      try {
        const todo = await getRebaseTodo(branch);
        setEntries(todo);
      } catch (e: unknown) {
        addToast(String(e), "error");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [getRebaseTodo, addToast],
  );

  const handleStartRebase = useCallback(async () => {
    if (!ontoBranch || entries.length === 0) return;
    try {
      const result = await interactiveRebase(ontoBranch, entries);
      if (result.completed) {
        addToast("Rebase completed successfully", "success");
      } else {
        addToast("Rebase has conflicts. Opening conflict resolver.", "warning");
        await fetchRebaseState();
        openModal("conflict");
      }
      await fetchStatus();
    } catch (e: unknown) {
      addToast(String(e), "error");
    }
  }, [
    ontoBranch,
    entries,
    interactiveRebase,
    fetchStatus,
    fetchRebaseState,
    addToast,
    openModal,
  ]);

  return (
    <div className="rebase-page">
      <div className="rebase-header">
        <h2>Interactive Rebase</h2>
      </div>

      <div className="rebase-branch-selector">
        <label htmlFor="rebase-onto">Rebase onto:</label>
        <select
          id="rebase-onto"
          value={ontoBranch}
          onChange={(e) => handleSelectBranch(e.target.value)}
        >
          <option value="">Select a branch...</option>
          {availableBranches.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!ontoBranch || entries.length === 0}
          onClick={handleStartRebase}
        >
          Start Rebase
        </button>
      </div>

      {loading ? (
        <div className="rebase-empty">
          <p>Loading commits...</p>
        </div>
      ) : (
        <RebaseTodoList entries={entries} onChange={setEntries} />
      )}

      {ontoBranch && entries.length > 0 && (
        <RebasePreview entries={entries} ontoBranch={ontoBranch} />
      )}
    </div>
  );
}
