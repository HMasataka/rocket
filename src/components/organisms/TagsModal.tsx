import { useCallback, useEffect, useState } from "react";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { CreateTagDialog } from "./CreateTagDialog";
import { Modal } from "./Modal";

interface TagsModalProps {
  onClose: () => void;
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function TagsModal({ onClose }: TagsModalProps) {
  const tags = useGitStore((s) => s.tags);
  const fetchTags = useGitStore((s) => s.fetchTags);
  const createTag = useGitStore((s) => s.createTag);
  const deleteTag = useGitStore((s) => s.deleteTag);
  const checkoutTag = useGitStore((s) => s.checkoutTag);
  const fetchBranch = useGitStore((s) => s.fetchBranch);
  const addToast = useUIStore((s) => s.addToast);

  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchTags().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [fetchTags, addToast]);

  const handleCreate = useCallback(
    async (name: string, message: string | null) => {
      try {
        await createTag(name, message);
        addToast(`Tag '${name}' created`, "success");
        setShowCreate(false);
        await fetchTags();
      } catch (e: unknown) {
        addToast(`Failed to create tag: ${String(e)}`, "error");
      }
    },
    [createTag, addToast, fetchTags],
  );

  const handleDelete = useCallback(
    async (name: string) => {
      try {
        await deleteTag(name);
        addToast(`Tag '${name}' deleted`, "success");
        await fetchTags();
      } catch (e: unknown) {
        addToast(`Failed to delete tag: ${String(e)}`, "error");
      }
    },
    [deleteTag, addToast, fetchTags],
  );

  const handleCheckout = useCallback(
    async (name: string) => {
      try {
        await checkoutTag(name);
        addToast(`Checked out tag '${name}' (detached HEAD)`, "info");
        await fetchBranch();
        onClose();
      } catch (e: unknown) {
        addToast(`Failed to checkout tag: ${String(e)}`, "error");
      }
    },
    [checkoutTag, addToast, fetchBranch, onClose],
  );

  return (
    <>
      <Modal
        title="Tags"
        width={520}
        onClose={onClose}
        footer={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            New Tag
          </button>
        }
      >
        {tags.length === 0 ? (
          <div className="empty-state">
            <p>No tags found</p>
          </div>
        ) : (
          <div className="tag-list">
            {tags.map((tag) => (
              <div key={tag.name} className="tag-item">
                <div className="tag-info">
                  <span className="tag-name">{tag.name}</span>
                  <span className="tag-meta">
                    {tag.target_short_oid}
                    {tag.tagger_date
                      ? ` \u00B7 ${formatDate(tag.tagger_date)}`
                      : ""}
                    {tag.is_annotated ? " \u00B7 annotated" : ""}
                  </span>
                </div>
                <div className="tag-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCheckout(tag.name)}
                  >
                    Checkout
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(tag.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
      {showCreate && (
        <CreateTagDialog
          onConfirm={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}
