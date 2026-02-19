import type { FileStatusKind } from "../../services/git";

interface StatusBadgeProps {
  kind: FileStatusKind;
}

const kindToLabel: Record<FileStatusKind, string> = {
  untracked: "?",
  modified: "M",
  deleted: "D",
  renamed: "R",
  typechange: "T",
};

const kindToClass: Record<FileStatusKind, string> = {
  untracked: "untracked",
  modified: "modify",
  deleted: "delete",
  renamed: "modify",
  typechange: "modify",
};

export function StatusBadge({ kind }: StatusBadgeProps) {
  return (
    <span className={`file-status ${kindToClass[kind]}`}>
      {kindToLabel[kind]}
    </span>
  );
}
