import { useState } from "react";
import { Modal } from "../../../components/organisms/Modal";
import type { MergeOption } from "../../../services/git";

interface MergeDialogProps {
  branchName: string;
  onConfirm: (option: MergeOption) => void;
  onClose: () => void;
}

export function MergeDialog({
  branchName,
  onConfirm,
  onClose,
}: MergeDialogProps) {
  const [option, setOption] = useState<MergeOption>("default");

  return (
    <Modal
      title={`Merge ${branchName}`}
      width={460}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(option)}
          >
            Merge
          </button>
        </>
      }
    >
      <div className="option-mode-selector">
        <label
          className={`option-mode${option === "default" ? " selected" : ""}`}
        >
          <input
            type="radio"
            name="merge-option"
            checked={option === "default"}
            onChange={() => setOption("default")}
          />
          <div className="mode-content">
            <div className="mode-title">Default</div>
            <div className="mode-desc">
              Fast-forward if possible, otherwise create a merge commit
            </div>
          </div>
        </label>
        <label
          className={`option-mode${option === "fast_forward_only" ? " selected" : ""}`}
        >
          <input
            type="radio"
            name="merge-option"
            checked={option === "fast_forward_only"}
            onChange={() => setOption("fast_forward_only")}
          />
          <div className="mode-content">
            <div className="mode-title">Fast-forward only</div>
            <div className="mode-desc">
              Fail if fast-forward is not possible
            </div>
          </div>
        </label>
        <label
          className={`option-mode${option === "no_fast_forward" ? " selected" : ""}`}
        >
          <input
            type="radio"
            name="merge-option"
            checked={option === "no_fast_forward"}
            onChange={() => setOption("no_fast_forward")}
          />
          <div className="mode-content">
            <div className="mode-title">No fast-forward</div>
            <div className="mode-desc">Always create a merge commit</div>
          </div>
        </label>
      </div>
    </Modal>
  );
}
