import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/organisms/Modal";
import { listGitignoreTemplates } from "../../../services/gitignore";
import { useTabStore } from "../../../stores/tabStore";
import { useUIStore } from "../../../stores/uiStore";

interface InitDialogProps {
  onClose: () => void;
}

export function InitDialog({ onClose }: InitDialogProps) {
  const [path, setPath] = useState("");
  const [gitignoreTemplate, setGitignoreTemplate] = useState("");
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const initInNewTab = useTabStore((s) => s.initInNewTab);
  const addToast = useUIStore((s) => s.addToast);
  const setActivePage = useUIStore((s) => s.setActivePage);

  useEffect(() => {
    listGitignoreTemplates()
      .then(setTemplates)
      .catch(() => {
        // Non-critical; template list is optional
      });
  }, []);

  const repoName = useMemo(() => {
    if (!path) return "";
    const parts = path.replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || "";
  }, [path]);

  const handleBrowse = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      setPath(selected);
    }
  }, []);

  const handleInit = useCallback(async () => {
    if (!path.trim()) return;
    setLoading(true);
    try {
      await initInNewTab(path.trim(), gitignoreTemplate || undefined);
      addToast("Repository initialized successfully", "success");
      setActivePage("changes");
      onClose();
    } catch (e: unknown) {
      addToast(`Init failed: ${String(e)}`, "error");
    } finally {
      setLoading(false);
    }
  }, [path, gitignoreTemplate, initInNewTab, addToast, setActivePage, onClose]);

  return (
    <Modal
      title="Initialize Repository"
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
            onClick={handleInit}
            disabled={!path.trim() || loading}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            {loading ? "Creating..." : "Create Repository"}
          </button>
        </>
      }
    >
      <div className="init-form">
        <div className="init-field">
          <label className="init-label" htmlFor="init-path">
            Directory Path
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
              id="init-path"
              type="text"
              className="init-input"
              placeholder="/path/to/new-project"
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

        <div className="init-field">
          <label className="init-label" htmlFor="init-repo-name">
            Repository Name
          </label>
          <input
            id="init-repo-name"
            type="text"
            className="init-input readonly"
            value={repoName}
            readOnly
          />
          <span className="init-derived">Derived from directory path</span>
        </div>

        <div className="init-field">
          <label className="init-label" htmlFor="init-gitignore">
            .gitignore Template
          </label>
          <select
            id="init-gitignore"
            className="modal-select"
            value={gitignoreTemplate}
            onChange={(e) => setGitignoreTemplate(e.target.value)}
          >
            <option value="">None</option>
            {templates.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
