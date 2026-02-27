import type { RevertMode } from "../../../services/revert";

interface RevertOptionsProps {
  mode: RevertMode;
  onModeChange: (mode: RevertMode) => void;
}

const MODES: { value: RevertMode; title: string; desc: string }[] = [
  {
    value: "auto",
    title: "Auto Commit",
    desc: "Automatically create a revert commit",
  },
  {
    value: "no_commit",
    title: "No Commit (--no-commit)",
    desc: "Apply changes without creating a commit",
  },
  {
    value: "edit",
    title: "Edit Message (--edit)",
    desc: "Edit the commit message before committing",
  },
];

export function RevertOptions({ mode, onModeChange }: RevertOptionsProps) {
  return (
    <div className="operation-options-inline">
      <h3>Revert Mode</h3>
      <div className="option-mode-selector">
        {MODES.map((m) => (
          <label
            key={m.value}
            className={`option-mode${mode === m.value ? " selected" : ""}`}
          >
            <input
              type="radio"
              name="revert-mode"
              value={m.value}
              checked={mode === m.value}
              onChange={() => onModeChange(m.value)}
            />
            <div className="mode-content">
              <div className="mode-title">{m.title}</div>
              <div className="mode-desc">{m.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
