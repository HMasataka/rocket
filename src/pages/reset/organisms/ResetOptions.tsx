import type { ResetMode } from "../../../services/reset";

interface ResetOptionsProps {
  mode: ResetMode;
  onModeChange: (mode: ResetMode) => void;
}

const MODES: {
  value: ResetMode;
  title: string;
  desc: string;
  className: string;
}[] = [
  {
    value: "soft",
    title: "Soft (--soft)",
    desc: "Move HEAD only. Changes remain staged.",
    className: "",
  },
  {
    value: "mixed",
    title: "Mixed (--mixed)",
    desc: "Reset HEAD and index. Changes remain in working tree.",
    className: "",
  },
  {
    value: "hard",
    title: "Hard (--hard)",
    desc: "Reset everything. All changes will be lost.",
    className: "hard",
  },
];

export function ResetOptions({ mode, onModeChange }: ResetOptionsProps) {
  return (
    <div className="operation-options-inline">
      <h3>Reset Mode</h3>
      <div className="option-mode-selector">
        {MODES.map((m) => {
          const classes = [
            "option-mode",
            mode === m.value ? "selected" : "",
            m.className,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <label key={m.value} className={classes}>
              <input
                type="radio"
                name="reset-mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => onModeChange(m.value)}
              />
              <div className="mode-content">
                <div className="mode-title">{m.title}</div>
                <div className="mode-desc">{m.desc}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
