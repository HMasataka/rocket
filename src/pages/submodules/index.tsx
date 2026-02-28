import { useCallback, useEffect, useState } from "react";
import { Modal } from "../../components/organisms/Modal";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { AddSubmoduleDialog } from "./organisms/AddSubmoduleDialog";
import { SubmoduleList } from "./organisms/SubmoduleList";

export function SubmodulesPage() {
  const submodules = useGitStore((s) => s.submodules);
  const fetchSubmodules = useGitStore((s) => s.fetchSubmodules);
  const addSubmodule = useGitStore((s) => s.addSubmodule);
  const updateSubmodule = useGitStore((s) => s.updateSubmodule);
  const updateAllSubmodules = useGitStore((s) => s.updateAllSubmodules);
  const removeSubmodule = useGitStore((s) => s.removeSubmodule);
  const addToast = useUIStore((s) => s.addToast);
  const activeModal = useUIStore((s) => s.activeModal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmodules().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchSubmodules, addToast]);

  const handleAdd = useCallback(
    async (url: string, path: string) => {
      try {
        await addSubmodule(url, path);
        addToast("Submodule added", "success");
        closeModal();
        await fetchSubmodules();
      } catch (e: unknown) {
        addToast(`Add submodule failed: ${String(e)}`, "error");
      }
    },
    [addSubmodule, addToast, closeModal, fetchSubmodules],
  );

  const handleUpdate = useCallback(
    async (path: string) => {
      try {
        await updateSubmodule(path);
        addToast(`Submodule '${path}' updated`, "success");
        await fetchSubmodules();
      } catch (e: unknown) {
        addToast(`Update failed: ${String(e)}`, "error");
      }
    },
    [updateSubmodule, addToast, fetchSubmodules],
  );

  const handleUpdateAll = useCallback(async () => {
    try {
      await updateAllSubmodules();
      addToast("All submodules updated", "success");
      await fetchSubmodules();
    } catch (e: unknown) {
      addToast(`Update all failed: ${String(e)}`, "error");
    }
  }, [updateAllSubmodules, addToast, fetchSubmodules]);

  const handleRemoveConfirm = useCallback(
    async (path: string) => {
      try {
        await removeSubmodule(path);
        addToast(`Submodule '${path}' removed`, "success");
        setConfirmRemove(null);
        await fetchSubmodules();
      } catch (e: unknown) {
        addToast(`Remove failed: ${String(e)}`, "error");
      }
    },
    [removeSubmodule, addToast, fetchSubmodules],
  );

  return (
    <div className="operation-layout">
      <div className="operation-header">
        <div className="operation-info">
          <h2 className="operation-title">Submodules</h2>
          <span className="operation-desc">
            Add, update, and remove submodules
          </span>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal("add-submodule")}
          >
            + Add
          </button>
        </div>
      </div>

      <SubmoduleList
        submodules={submodules}
        onUpdate={handleUpdate}
        onUpdateAll={handleUpdateAll}
        onRemove={(path) => setConfirmRemove(path)}
      />

      {activeModal === "add-submodule" && (
        <AddSubmoduleDialog onConfirm={handleAdd} onClose={closeModal} />
      )}

      {confirmRemove && (
        <Modal
          title="Remove Submodule"
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
            Remove submodule <strong>{confirmRemove}</strong>? This will
            deinitialize and remove it from the repository.
          </p>
        </Modal>
      )}
    </div>
  );
}
