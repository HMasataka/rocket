import { useCallback, useEffect, useState } from "react";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { StashDetailPanel } from "./organisms/StashDetailPanel";
import { StashFooter } from "./organisms/StashFooter";
import { StashListPanel } from "./organisms/StashListPanel";
import { StashSaveDialog } from "./organisms/StashSaveDialog";

export function StashPage() {
  const stashes = useGitStore((s) => s.stashes);
  const fetchStashes = useGitStore((s) => s.fetchStashes);
  const stashSave = useGitStore((s) => s.stashSave);
  const applyStash = useGitStore((s) => s.applyStash);
  const popStash = useGitStore((s) => s.popStash);
  const dropStash = useGitStore((s) => s.dropStash);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const addToast = useUIStore((s) => s.addToast);
  const activeModal = useUIStore((s) => s.activeModal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchStashes().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchStashes, addToast]);

  const selectedEntry = stashes.find((s) => s.index === selectedIndex) ?? null;

  const refreshAll = useCallback(async () => {
    await fetchStashes();
    await fetchStatus();
  }, [fetchStashes, fetchStatus]);

  const handleStashSave = useCallback(
    async (message: string | null) => {
      try {
        await stashSave(message);
        addToast("Changes stashed", "success");
        closeModal();
        await refreshAll();
      } catch (e: unknown) {
        addToast(`Stash failed: ${String(e)}`, "error");
      }
    },
    [stashSave, addToast, closeModal, refreshAll],
  );

  const handleApply = useCallback(async () => {
    if (selectedIndex === null) return;
    try {
      await applyStash(selectedIndex);
      addToast("Stash applied", "success");
      await refreshAll();
    } catch (e: unknown) {
      addToast(`Apply failed: ${String(e)}`, "error");
    }
  }, [selectedIndex, applyStash, addToast, refreshAll]);

  const handlePop = useCallback(async () => {
    if (selectedIndex === null) return;
    try {
      await popStash(selectedIndex);
      addToast("Stash popped", "success");
      setSelectedIndex(null);
      await refreshAll();
    } catch (e: unknown) {
      addToast(`Pop failed: ${String(e)}`, "error");
    }
  }, [selectedIndex, popStash, addToast, refreshAll]);

  const handleDrop = useCallback(async () => {
    if (selectedIndex === null) return;
    try {
      await dropStash(selectedIndex);
      addToast("Stash dropped", "success");
      setSelectedIndex(null);
      await refreshAll();
    } catch (e: unknown) {
      addToast(`Drop failed: ${String(e)}`, "error");
    }
  }, [selectedIndex, dropStash, addToast, refreshAll]);

  return (
    <div className="operation-layout">
      <div className="operation-header">
        <div className="operation-info">
          <h2 className="operation-title">Stash</h2>
          <span className="operation-desc">
            {stashes.length} stash{stashes.length !== 1 ? "es" : ""}
          </span>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal("stash-save")}
          >
            + Stash Changes
          </button>
        </div>
      </div>
      <div className="operation-two-column">
        <StashListPanel
          stashes={stashes}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
        <StashDetailPanel entry={selectedEntry} />
      </div>
      <StashFooter
        hasSelection={selectedIndex !== null}
        onApply={handleApply}
        onPop={handlePop}
        onDrop={handleDrop}
      />

      {activeModal === "stash-save" && (
        <StashSaveDialog onConfirm={handleStashSave} onClose={closeModal} />
      )}
    </div>
  );
}
