import type { CherryPickMode } from "../../../services/cherryPick";

interface CherryPickOptionsProps {
  mode: CherryPickMode;
  onModeChange: (mode: CherryPickMode) => void;
}

const MODES: { value: CherryPickMode; title: string; desc: string }[] = [
  {
    value: "normal",
    title: "Normal (-x)",
    desc: "Create commit with original info in message",
  },
  {
    value: "no_commit",
    title: "No Commit (--no-commit)",
    desc: "Apply changes without creating a commit",
  },
  {
    value: "merge",
    title: "Allow Merge (-m)",
    desc: "Allow cherry-picking merge commits",
  },
];

export function CherryPickOptions({
  mode,
  onModeChange,
}: CherryPickOptionsProps) {
  return (
    <div className="operation-options-inline">
      <h3>Cherry-pick Mode</h3>
      <div className="option-mode-selector">
        {MODES.map((m) => (
          <label
            key={m.value}
            className={`option-mode${mode === m.value ? " selected" : ""}`}
          >
            <input
              type="radio"
              name="cherry-mode"
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
