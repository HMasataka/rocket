import { useCallback, useEffect, useState } from "react";
import { Modal } from "../../components/organisms/Modal";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { AddWorktreeDialog } from "./organisms/AddWorktreeDialog";
import { WorktreeList } from "./organisms/WorktreeList";

export function WorktreesPage() {
  const worktrees = useGitStore((s) => s.worktrees);
  const fetchWorktrees = useGitStore((s) => s.fetchWorktrees);
  const addWorktree = useGitStore((s) => s.addWorktree);
  const removeWorktree = useGitStore((s) => s.removeWorktree);
  const addToast = useUIStore((s) => s.addToast);
  const activeModal = useUIStore((s) => s.activeModal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    fetchWorktrees().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchWorktrees, addToast]);

  const handleAdd = useCallback(
    async (path: string, branch: string) => {
      try {
        await addWorktree(path, branch);
        addToast("Worktree added", "success");
        closeModal();
        await fetchWorktrees();
      } catch (e: unknown) {
        addToast(`Add worktree failed: ${String(e)}`, "error");
      }
    },
    [addWorktree, addToast, closeModal, fetchWorktrees],
  );

  const handleRemoveConfirm = useCallback(
    async (path: string) => {
      try {
        await removeWorktree(path);
        addToast(`Worktree '${path}' removed`, "success");
        setConfirmRemove(null);
        await fetchWorktrees();
      } catch (e: unknown) {
        addToast(`Remove failed: ${String(e)}`, "error");
      }
    },
    [removeWorktree, addToast, fetchWorktrees],
  );

  return (
    <div className="operation-layout">
      <div className="operation-header">
        <div className="operation-info">
          <h2 className="operation-title">Worktrees</h2>
          <span className="operation-desc">Manage multiple worktrees</span>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal("add-worktree")}
          >
            + Add
          </button>
        </div>
      </div>

      <WorktreeList
        worktrees={worktrees}
        onRemove={(path) => setConfirmRemove(path)}
      />

      {activeModal === "add-worktree" && (
        <AddWorktreeDialog onConfirm={handleAdd} onClose={closeModal} />
      )}

      {confirmRemove && (
        <Modal
          title="Remove Worktree"
          width={420}
          onClose={() => setConfirmRemove(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmRemove(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRemoveConfirm(confirmRemove)}
              >
                Remove
              </button>
            </>
          }
        >
          <p>
            Remove worktree at <strong>{confirmRemove}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
