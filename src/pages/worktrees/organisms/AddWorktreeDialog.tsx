import { useCallback, useId, useState } from "react";
import { Modal } from "../../../components/organisms/Modal";

interface AddWorktreeDialogProps {
  onConfirm: (path: string, branch: string) => void;
  onClose: () => void;
}

export function AddWorktreeDialog({
  onConfirm,
  onClose,
}: AddWorktreeDialogProps) {
  const [path, setPath] = useState("");
  const [branch, setBranch] = useState("");
  const pathId = useId();
  const branchId = useId();

  const handleSubmit = useCallback(() => {
    if (!path.trim() || !branch.trim()) return;
    onConfirm(path.trim(), branch.trim());
  }, [path, branch, onConfirm]);

  return (
    <Modal
      title="Add Worktree"
      width={420}
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
            disabled={!path.trim() || !branch.trim()}
          >
            Add
          </button>
        </>
      }
    >
      <label className="modal-label" htmlFor={pathId}>
        Path
      </label>
      <input
        id={pathId}
        className="modal-input"
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="/path/to/new/worktree"
      />
      <label className="modal-label" htmlFor={branchId}>
        Branch
      </label>
      <input
        id={branchId}
        className="modal-input"
        type="text"
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
        placeholder="feature/my-branch"
      />
    </Modal>
  );
}
