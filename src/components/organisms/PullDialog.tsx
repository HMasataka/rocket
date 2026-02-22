import { useCallback, useState } from "react";
import type { PullOption } from "../../services/git";
import { Modal } from "./Modal";

interface PullDialogProps {
  remoteName: string;
  onConfirm: (option: PullOption) => void;
  onClose: () => void;
}

export function PullDialog({
  remoteName,
  onConfirm,
  onClose,
}: PullDialogProps) {
  const [option, setOption] = useState<PullOption>("merge");

  const handleConfirm = useCallback(() => {
    onConfirm(option);
  }, [option, onConfirm]);

  return (
    <Modal
      title={`Pull from ${remoteName}`}
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
            onClick={handleConfirm}
          >
            Pull
          </button>
        </>
      }
    >
      <div className="modal-label">Strategy</div>
      <div className="radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="pull-option"
            checked={option === "merge"}
            onChange={() => setOption("merge")}
          />
          Merge
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="pull-option"
            checked={option === "rebase"}
            onChange={() => setOption("rebase")}
          />
          Rebase
        </label>
      </div>
    </Modal>
  );
}
