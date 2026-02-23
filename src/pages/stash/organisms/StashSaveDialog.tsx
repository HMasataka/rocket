import { useId, useState } from "react";
import { Modal } from "../../../components/organisms/Modal";

interface StashSaveDialogProps {
  onConfirm: (message: string | null) => void;
  onClose: () => void;
}

export function StashSaveDialog({ onConfirm, onClose }: StashSaveDialogProps) {
  const [message, setMessage] = useState("");
  const inputId = useId();

  const handleSubmit = () => {
    onConfirm(message.trim() || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Modal
      title="Stash Changes"
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
          >
            Stash
          </button>
        </>
      }
    >
      <label className="modal-label" htmlFor={inputId}>
        Message (optional)
      </label>
      <input
        id={inputId}
        className="modal-input"
        type="text"
        placeholder="WIP: describe your changes"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </Modal>
  );
}
