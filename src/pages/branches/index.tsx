import { useCallback, useEffect, useState } from "react";
import type { MergeOption } from "../../services/git";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { BranchDetailPanel } from "./organisms/BranchDetailPanel";
import { BranchFooter } from "./organisms/BranchFooter";
import { BranchListPanel } from "./organisms/BranchListPanel";
import { CreateBranchDialog } from "./organisms/CreateBranchDialog";
import { DeleteBranchDialog } from "./organisms/DeleteBranchDialog";
import { MergeDialog } from "./organisms/MergeDialog";
import { RenameBranchDialog } from "./organisms/RenameBranchDialog";

export function BranchesPage() {
  const branches = useGitStore((s) => s.branches);
  const fetchBranches = useGitStore((s) => s.fetchBranches);
  const fetchBranch = useGitStore((s) => s.fetchBranch);
  const createBranch = useGitStore((s) => s.createBranch);
  const checkoutBranch = useGitStore((s) => s.checkoutBranch);
  const deleteBranch = useGitStore((s) => s.deleteBranch);
  const renameBranch = useGitStore((s) => s.renameBranch);
  const mergeBranch = useGitStore((s) => s.mergeBranch);
  const addToast = useUIStore((s) => s.addToast);
  const activeModal = useUIStore((s) => s.activeModal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchBranches, addToast]);

  const selected = branches.find((b) => b.name === selectedBranch) ?? null;

  const refreshAll = useCallback(async () => {
    await fetchBranches();
    await fetchBranch();
  }, [fetchBranches, fetchBranch]);

  const handleCreateBranch = useCallback(
    async (name: string) => {
      try {
        await createBranch(name);
        addToast(`Branch '${name}' created`, "success");
        closeModal();
        await refreshAll();
      } catch (e: unknown) {
        addToast(`Failed to create branch: ${String(e)}`, "error");
      }
    },
    [createBranch, addToast, closeModal, refreshAll],
  );

  const handleCheckoutBranch = useCallback(async () => {
    if (!selected) return;
    try {
      await checkoutBranch(selected.name);
      addToast(`Switched to '${selected.name}'`, "success");
      await refreshAll();
    } catch (e: unknown) {
      addToast(`Failed to switch branch: ${String(e)}`, "error");
    }
  }, [selected, checkoutBranch, addToast, refreshAll]);

  const handleDeleteBranch = useCallback(async () => {
    if (!selected) return;
    try {
      await deleteBranch(selected.name);
      addToast(`Branch '${selected.name}' deleted`, "success");
      setSelectedBranch(null);
      closeModal();
      await refreshAll();
    } catch (e: unknown) {
      addToast(`Failed to delete branch: ${String(e)}`, "error");
    }
  }, [selected, deleteBranch, addToast, closeModal, refreshAll]);

  const handleRenameBranch = useCallback(
    async (newName: string) => {
      if (!selected) return;
      try {
        await renameBranch(selected.name, newName);
        addToast(`Branch renamed to '${newName}'`, "success");
        setSelectedBranch(newName);
        closeModal();
        await refreshAll();
      } catch (e: unknown) {
        addToast(`Failed to rename branch: ${String(e)}`, "error");
      }
    },
    [selected, renameBranch, addToast, closeModal, refreshAll],
  );

  const handleMergeBranch = useCallback(
    async (option: MergeOption) => {
      if (!selected) return;
      try {
        const result = await mergeBranch(selected.name, option);
        addToast(`Merge ${result.kind}: ${selected.name}`, "success");
        closeModal();
        await refreshAll();
      } catch (e: unknown) {
        addToast(`Merge failed: ${String(e)}`, "error");
      }
    },
    [selected, mergeBranch, addToast, closeModal, refreshAll],
  );

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-info">
          <h2 className="page-title">Branches</h2>
          <span className="page-desc">Manage local and remote branches</span>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => openModal("create-branch")}
          >
            + New Branch
          </button>
        </div>
      </div>
      <div className="branches-content">
        <BranchListPanel
          branches={branches}
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
        />
        <BranchDetailPanel
          branch={selected}
          onSwitch={handleCheckoutBranch}
          onMerge={() => openModal("merge")}
        />
      </div>
      <BranchFooter
        branch={selected}
        onSwitch={handleCheckoutBranch}
        onRename={() => openModal("rename")}
        onDelete={() => openModal("delete")}
      />

      {activeModal === "create-branch" && (
        <CreateBranchDialog
          onConfirm={handleCreateBranch}
          onClose={closeModal}
        />
      )}
      {activeModal === "merge" && selected && (
        <MergeDialog
          branchName={selected.name}
          onConfirm={handleMergeBranch}
          onClose={closeModal}
        />
      )}
      {activeModal === "rename" && selected && (
        <RenameBranchDialog
          currentName={selected.name}
          onConfirm={handleRenameBranch}
          onClose={closeModal}
        />
      )}
      {activeModal === "delete" && selected && (
        <DeleteBranchDialog
          branchName={selected.name}
          onConfirm={handleDeleteBranch}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
