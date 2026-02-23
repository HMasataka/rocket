import { useEffect, useRef, useState } from "react";
import type { RebaseAction, RebaseTodoEntry } from "../../../services/rebase";

const ACTIONS: RebaseAction[] = [
  "pick",
  "reword",
  "edit",
  "squash",
  "fixup",
  "drop",
];

function nextAction(current: RebaseAction): RebaseAction {
  const idx = ACTIONS.indexOf(current);
  return ACTIONS[(idx + 1) % ACTIONS.length];
}

interface RebaseCommitItemProps {
  entry: RebaseTodoEntry;
  index: number;
  total: number;
  onChangeAction: (action: RebaseAction) => void;
  onChangeMessage: (message: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function RebaseCommitItem({
  entry,
  index,
  total,
  onChangeAction,
  onChangeMessage,
  onMoveUp,
  onMoveDown,
}: RebaseCommitItemProps) {
  const [editing, setEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(entry.message);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleCycleAction = () => {
    const next = nextAction(entry.action);
    onChangeAction(next);
    if (next === "reword") {
      setEditing(true);
      setEditMessage(entry.message);
    }
  };

  const handleFinishEdit = () => {
    onChangeMessage(editMessage);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishEdit();
    } else if (e.key === "Escape") {
      setEditing(false);
      setEditMessage(entry.message);
    }
  };

  return (
    <div className="rebase-commit">
      <div className="rebase-move-btns">
        <button
          type="button"
          className="rebase-move-btn"
          disabled={index === 0}
          onClick={onMoveUp}
          aria-label="Move up"
        >
          ^
        </button>
        <button
          type="button"
          className="rebase-move-btn"
          disabled={index === total - 1}
          onClick={onMoveDown}
          aria-label="Move down"
        >
          v
        </button>
      </div>
      <button
        type="button"
        className={`rebase-action action-${entry.action}`}
        onClick={handleCycleAction}
        title="Click to cycle action"
      >
        {entry.action}
      </button>
      <span className="rebase-hash">{entry.short_oid}</span>
      {editing ? (
        <input
          ref={inputRef}
          className="rebase-reword-input"
          value={editMessage}
          onChange={(e) => setEditMessage(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="rebase-msg">{entry.message}</span>
      )}
      <span className="rebase-author">{entry.author_name}</span>
    </div>
  );
}
