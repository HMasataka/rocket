import { useCallback, useEffect, useState } from "react";
import type { RemoteInfo } from "../../services/git";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { AddRemoteDialog } from "./AddRemoteDialog";
import { Modal } from "./Modal";

interface RemoteModalProps {
  onClose: () => void;
}

export function RemoteModal({ onClose }: RemoteModalProps) {
  const remotes = useGitStore((s) => s.remotes);
  const fetchRemotes = useGitStore((s) => s.fetchRemotes);
  const removeRemote = useGitStore((s) => s.removeRemote);
  const addToast = useUIStore((s) => s.addToast);

  const [selectedRemote, setSelectedRemote] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<RemoteInfo | null>(null);

  useEffect(() => {
    fetchRemotes().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchRemotes, addToast]);

  const handleRemoveRemote = useCallback(
    async (name: string) => {
      try {
        await removeRemote(name);
        addToast(`Remote '${name}' removed`, "success");
        if (selectedRemote === name) {
          setSelectedRemote(null);
        }
        await fetchRemotes();
      } catch (e: unknown) {
        addToast(`Failed to remove remote: ${String(e)}`, "error");
      }
    },
    [removeRemote, addToast, fetchRemotes, selectedRemote],
  );

  const handleDialogClose = useCallback(() => {
    setShowAddDialog(false);
    setEditTarget(null);
    fetchRemotes().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchRemotes, addToast]);

  if (showAddDialog || editTarget) {
    return (
      <AddRemoteDialog editTarget={editTarget} onClose={handleDialogClose} />
    );
  }

  return (
    <Modal
      title="Remotes"
      width={480}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddDialog(true)}
          >
            Add Remote
          </button>
        </>
      }
    >
      <div className="remote-section-label">Configured Remotes</div>
      <div className="remote-list">
        {remotes.length === 0 && (
          <p className="remote-empty-message">No remotes configured</p>
        )}
        {remotes.map((remote) => (
          <button
            key={remote.name}
            type="button"
            className={`remote-item${selectedRemote === remote.name ? " active" : ""}`}
            onClick={() => setSelectedRemote(remote.name)}
          >
            <div className="remote-info">
              <div className="remote-name">{remote.name}</div>
              <div className="remote-url">{remote.url}</div>
            </div>
            <div className="remote-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTarget(remote);
                }}
                title="Edit remote"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61z" />
                </svg>
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveRemote(remote.name);
                }}
                title="Remove remote"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75zM11 3V1.75A1.75 1.75 0 0 0 9.25 0h-2.5A1.75 1.75 0 0 0 5 1.75V3H2.75a.75.75 0 0 0 0 1.5h.928l.38 8.35a1.75 1.75 0 0 0 1.743 1.65h4.398a1.75 1.75 0 0 0 1.743-1.65l.38-8.35h.928a.75.75 0 0 0 0-1.5H11z" />
                </svg>
              </button>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
