import { Modal } from "../../../components/organisms/Modal";

interface DeleteBranchDialogProps {
  branchName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteBranchDialog({
  branchName,
  onConfirm,
  onClose,
}: DeleteBranchDialogProps) {
  return (
    <Modal
      title="Delete Branch"
      width={420}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </>
      }
    >
      <p>
        Are you sure you want to delete branch <strong>{branchName}</strong>?
        This action cannot be undone.
      </p>
    </Modal>
  );
}
