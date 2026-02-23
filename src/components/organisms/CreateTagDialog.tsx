import { useId, useState } from "react";
import { Modal } from "./Modal";

interface CreateTagDialogProps {
  onConfirm: (name: string, message: string | null) => void;
  onClose: () => void;
}

export function CreateTagDialog({ onConfirm, onClose }: CreateTagDialogProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const nameId = useId();
  const messageId = useId();

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm(name.trim(), message.trim() || null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleSubmit();
    }
  };

  return (
    <Modal
      title="New Tag"
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
      <label className="modal-label" htmlFor={nameId}>
        Tag name
      </label>
      <input
        id={nameId}
        className="modal-input"
        type="text"
        placeholder="v1.0.0"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <label
        className="modal-label"
        htmlFor={messageId}
        style={{ marginTop: 12 }}
      >
        Message (optional, creates annotated tag)
      </label>
      <input
        id={messageId}
        className="modal-input"
        type="text"
        placeholder="Release description"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </Modal>
  );
}
