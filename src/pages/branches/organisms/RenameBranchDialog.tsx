import { useId, useState } from "react";
import { Modal } from "../../../components/organisms/Modal";

interface RenameBranchDialogProps {
  currentName: string;
  onConfirm: (newName: string) => void;
  onClose: () => void;
}

export function RenameBranchDialog({
  currentName,
  onConfirm,
  onClose,
}: RenameBranchDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const inputId = useId();

  const isValid = newName.trim() !== "" && newName.trim() !== currentName;

  const handleSubmit = () => {
    if (isValid) {
      onConfirm(newName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      handleSubmit();
    }
  };

  return (
    <Modal
      title={`Rename ${currentName}`}
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
            disabled={!isValid}
            onClick={handleSubmit}
          >
            Rename
          </button>
        </>
      }
    >
      <label className="modal-label" htmlFor={inputId}>
        New branch name
      </label>
      <input
        id={inputId}
        className="modal-input"
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </Modal>
  );
}
