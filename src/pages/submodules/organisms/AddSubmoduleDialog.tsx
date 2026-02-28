import { useCallback, useId, useState } from "react";
import { Modal } from "../../../components/organisms/Modal";

interface AddSubmoduleDialogProps {
  onConfirm: (url: string, path: string) => void;
  onClose: () => void;
}

export function AddSubmoduleDialog({
  onConfirm,
  onClose,
}: AddSubmoduleDialogProps) {
  const [url, setUrl] = useState("");
  const [path, setPath] = useState("");
  const urlId = useId();
  const pathId = useId();

  const handleSubmit = useCallback(() => {
    if (!url.trim()) return;
    const resolvedPath = path.trim() || derivePathFromUrl(url.trim());
    onConfirm(url.trim(), resolvedPath);
  }, [url, path, onConfirm]);

  return (
    <Modal
      title="Add Submodule"
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
            disabled={!url.trim()}
          >
            Add
          </button>
        </>
      }
    >
      <label className="modal-label" htmlFor={urlId}>
        Repository URL
      </label>
      <input
        id={urlId}
        className="modal-input"
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/example/repo.git"
      />
      <label className="modal-label" htmlFor={pathId}>
        Path (optional)
      </label>
      <input
        id={pathId}
        className="modal-input"
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="Derived from URL if empty"
      />
    </Modal>
  );
}

function derivePathFromUrl(url: string): string {
  const lastSegment = url.split("/").pop() ?? url;
  return lastSegment.replace(/\.git$/, "");
}
