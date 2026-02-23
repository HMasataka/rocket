import type { RebaseTodoEntry } from "../../../services/rebase";

interface RebasePreviewProps {
  entries: RebaseTodoEntry[];
  ontoBranch: string;
}

export function RebasePreview({ entries, ontoBranch }: RebasePreviewProps) {
  const pickCount = entries.filter((e) => e.action === "pick").length;
  const squashCount = entries.filter((e) => e.action === "squash").length;
  const fixupCount = entries.filter((e) => e.action === "fixup").length;
  const dropCount = entries.filter((e) => e.action === "drop").length;
  const rewordCount = entries.filter((e) => e.action === "reword").length;
  const editCount = entries.filter((e) => e.action === "edit").length;

  return (
    <div className="rebase-footer">
      <span className="rebase-preview-onto">
        Onto: <strong>{ontoBranch}</strong>
      </span>
      <span className="rebase-preview-summary">
        {pickCount} pick
        {squashCount > 0 && `, ${squashCount} squash`}
        {fixupCount > 0 && `, ${fixupCount} fixup`}
        {dropCount > 0 && `, ${dropCount} drop`}
        {rewordCount > 0 && `, ${rewordCount} reword`}
        {editCount > 0 && `, ${editCount} edit`}
      </span>
      <div className="rebase-footer-spacer" />
    </div>
  );
}
