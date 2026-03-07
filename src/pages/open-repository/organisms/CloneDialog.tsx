import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useState } from "react";
import { Modal } from "../../../components/organisms/Modal";
import { useTabStore } from "../../../stores/tabStore";
import { useUIStore } from "../../../stores/uiStore";

interface CloneDialogProps {
  onClose: () => void;
}

export function CloneDialog({ onClose }: CloneDialogProps) {
  const [url, setUrl] = useState("");
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(false);
  const cloneInNewTab = useTabStore((s) => s.cloneInNewTab);
  const addToast = useUIStore((s) => s.addToast);
  const setActivePage = useUIStore((s) => s.setActivePage);

  const handleBrowse = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      setPath(selected);
    }
  }, []);

  const handleClone = useCallback(async () => {
    if (!url.trim() || !path.trim()) return;
    setLoading(true);
    try {
      await cloneInNewTab(url.trim(), path.trim());
      addToast("Repository cloned successfully", "success");
      setActivePage("changes");
      onClose();
    } catch (e: unknown) {
      addToast(`Clone failed: ${String(e)}`, "error");
    } finally {
      setLoading(false);
    }
  }, [url, path, cloneInNewTab, addToast, setActivePage, onClose]);

  const isValid = url.trim().length > 0 && path.trim().length > 0;

  return (
    <Modal
      title="Clone Repository"
      width={520}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleClone}
            disabled={!isValid || loading}
          >
            {loading ? "Cloning..." : "Clone"}
          </button>
        </>
      }
    >
      <div className="init-form">
        <div className="init-field">
          <label className="init-label" htmlFor="clone-url">
            Repository URL
          </label>
          <input
            id="clone-url"
            type="text"
            className="init-input"
            placeholder="https://github.com/user/repo.git"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="init-field">
          <label className="init-label" htmlFor="clone-path">
            Clone to Directory
          </label>
          <div className="init-path-group">
            <svg
              className="init-path-icon"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-10Z" />
            </svg>
            <input
              id="clone-path"
              type="text"
              className="init-input"
              placeholder="/path/to/clone"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
            <button
              type="button"
              className="init-browse-btn"
              onClick={handleBrowse}
            >
              Browse
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
