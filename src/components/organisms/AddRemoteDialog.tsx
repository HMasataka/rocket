import { useCallback, useState } from "react";
import type { RemoteInfo } from "../../services/git";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { Modal } from "./Modal";

interface AddRemoteDialogProps {
  editTarget: RemoteInfo | null;
  onClose: () => void;
}

export function AddRemoteDialog({ editTarget, onClose }: AddRemoteDialogProps) {
  const addRemote = useGitStore((s) => s.addRemote);
  const editRemote = useGitStore((s) => s.editRemote);
  const addToast = useUIStore((s) => s.addToast);

  const [name, setName] = useState(editTarget?.name ?? "");
  const [url, setUrl] = useState(editTarget?.url ?? "");

  const isEdit = editTarget !== null;
  const isValid = name.trim().length > 0 && url.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    try {
      if (isEdit) {
        await editRemote(editTarget.name, url.trim());
        addToast(`Remote '${editTarget.name}' updated`, "success");
      } else {
        await addRemote(name.trim(), url.trim());
        addToast(`Remote '${name.trim()}' added`, "success");
      }
      onClose();
    } catch (e: unknown) {
      addToast(
        `Failed to ${isEdit ? "edit" : "add"} remote: ${String(e)}`,
        "error",
      );
    }
  }, [
    isValid,
    isEdit,
    editTarget,
    name,
    url,
    addRemote,
    editRemote,
    addToast,
    onClose,
  ]);

  return (
    <Modal
      title={isEdit ? "Edit Remote" : "Add Remote"}
      width={400}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            {isEdit ? "Save" : "Add"}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <label className="modal-label" htmlFor="remote-name">
          Name
        </label>
        <input
          id="remote-name"
          className="modal-input"
          type="text"
          placeholder="origin"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isEdit}
        />
      </div>
      <div>
        <label className="modal-label" htmlFor="remote-url">
          URL
        </label>
        <input
          id="remote-url"
          className="modal-input"
          type="text"
          placeholder="https://github.com/user/repo.git"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
    </Modal>
  );
}
