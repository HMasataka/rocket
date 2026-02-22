import { useId, useState } from "react";
import { Modal } from "../../../components/organisms/Modal";

interface CreateBranchDialogProps {
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export function CreateBranchDialog({
  onConfirm,
  onClose,
}: CreateBranchDialogProps) {
  const [name, setName] = useState("");
  const inputId = useId();

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleSubmit();
    }
  };

  return (
    <Modal
      title="New Branch"
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
            disabled={!name.trim()}
            onClick={handleSubmit}
          >
            Create
          </button>
        </>
      }
    >
      <label className="modal-label" htmlFor={inputId}>
        Branch name
      </label>
      <input
        id={inputId}
        className="modal-input"
        type="text"
        placeholder="feature/my-branch"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </Modal>
  );
}
