import type { RebaseAction, RebaseTodoEntry } from "../../../services/rebase";
import { RebaseCommitItem } from "../molecules/RebaseCommitItem";

interface RebaseTodoListProps {
  entries: RebaseTodoEntry[];
  onChange: (entries: RebaseTodoEntry[]) => void;
}

export function RebaseTodoList({ entries, onChange }: RebaseTodoListProps) {
  const handleChangeAction = (index: number, action: RebaseAction) => {
    const updated = entries.map((entry, i) =>
      i === index ? { ...entry, action } : entry,
    );
    onChange(updated);
  };

  const handleChangeMessage = (index: number, message: string) => {
    const updated = entries.map((entry, i) =>
      i === index ? { ...entry, message } : entry,
    );
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...entries];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === entries.length - 1) return;
    const updated = [...entries];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  if (entries.length === 0) {
    return (
      <div className="rebase-empty">
        <p>No commits to rebase. Select a target branch to see commits.</p>
      </div>
    );
  }

  return (
    <div className="rebase-commit-list">
      {entries.map((entry, i) => (
        <RebaseCommitItem
          key={entry.oid}
          entry={entry}
          index={i}
          total={entries.length}
          onChangeAction={(action) => handleChangeAction(i, action)}
          onChangeMessage={(message) => handleChangeMessage(i, message)}
          onMoveUp={() => handleMoveUp(i)}
          onMoveDown={() => handleMoveDown(i)}
        />
      ))}
    </div>
  );
}
