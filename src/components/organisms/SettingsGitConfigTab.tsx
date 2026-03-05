import {
  type ChangeEvent,
  type FocusEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { GitConfigEntry, GitConfigScope } from "../../services/gitconfig";
import {
  getGitconfigEntries,
  getGitconfigPath,
  setGitconfigValue,
  unsetGitconfigValue,
} from "../../services/gitconfig";
import { useUIStore } from "../../stores/uiStore";

interface ConfigSection {
  title: string;
  keys: ConfigKeyDef[];
}

interface ConfigKeyDef {
  key: string;
  type: "text" | "select" | "toggle";
  placeholder?: string;
  options?: string[];
}

const SECTIONS: ConfigSection[] = [
  {
    title: "User",
    keys: [
      { key: "user.name", type: "text" },
      { key: "user.email", type: "text" },
      {
        key: "user.signingKey",
        type: "text",
        placeholder: "GPG or SSH key ID",
      },
    ],
  },
  {
    title: "Commit",
    keys: [
      {
        key: "gpg.format",
        type: "select",
        options: ["openpgp", "ssh", "x509"],
      },
      { key: "commit.gpgSign", type: "toggle" },
      {
        key: "commit.template",
        type: "text",
        placeholder: "~/.gitmessage",
      },
    ],
  },
  {
    title: "Core",
    keys: [
      { key: "core.editor", type: "text" },
      {
        key: "core.autocrlf",
        type: "select",
        options: ["input", "true", "false"],
      },
      {
        key: "core.excludesFile",
        type: "text",
        placeholder: "~/.gitignore_global",
      },
    ],
  },
  {
    title: "Pull & Push",
    keys: [
      {
        key: "pull.rebase",
        type: "select",
        options: ["false", "true", "merges"],
      },
      {
        key: "push.default",
        type: "select",
        options: ["simple", "current", "upstream", "matching"],
      },
      { key: "push.autoSetupRemote", type: "toggle" },
    ],
  },
  {
    title: "Merge",
    keys: [
      {
        key: "merge.ff",
        type: "select",
        options: ["true", "false", "only"],
      },
      {
        key: "merge.conflictStyle",
        type: "select",
        options: ["merge", "diff3", "zdiff3"],
      },
    ],
  },
];

interface DeferredInputProps {
  id: string;
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
}

function DeferredInput({
  id,
  value,
  placeholder,
  onCommit,
}: DeferredInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== value) {
      onCommit(e.target.value);
    }
  };

  return (
    <input
      id={id}
      type="text"
      className="settings-input"
      value={localValue}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        setLocalValue(e.target.value)
      }
      onBlur={handleBlur}
    />
  );
}

export function SettingsGitConfigTab() {
  const [scope, setScope] = useState<GitConfigScope>("local");
  const [configPath, setConfigPath] = useState("");
  const [entries, setEntries] = useState<Map<string, string>>(new Map());
  const [aliases, setAliases] = useState<GitConfigEntry[]>([]);
  const addToast = useUIStore((s) => s.addToast);

  const loadEntries = useCallback(
    async (s: GitConfigScope) => {
      try {
        const [allEntries, path] = await Promise.all([
          getGitconfigEntries(s),
          getGitconfigPath(s),
        ]);
        const map = new Map<string, string>();
        const aliasList: GitConfigEntry[] = [];
        for (const entry of allEntries) {
          if (entry.key.startsWith("alias.")) {
            aliasList.push({
              key: entry.key.replace("alias.", ""),
              value: entry.value,
            });
          }
          map.set(entry.key, entry.value);
        }
        setEntries(map);
        setAliases(aliasList);
        setConfigPath(path);
      } catch (e) {
        addToast(String(e), "error");
      }
    },
    [addToast],
  );

  useEffect(() => {
    loadEntries(scope);
  }, [scope, loadEntries]);

  const handleScopeChange = (newScope: GitConfigScope) => {
    setScope(newScope);
  };

  const handleValueChange = useCallback(
    async (key: string, value: string) => {
      try {
        if (value === "") {
          await unsetGitconfigValue(scope, key);
        } else {
          await setGitconfigValue(scope, key, value);
        }
        setEntries((prev) => {
          const next = new Map(prev);
          if (value === "") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
          return next;
        });
      } catch (e) {
        addToast(String(e), "error");
      }
    },
    [scope, addToast],
  );

  const handleToggle = useCallback(
    async (key: string) => {
      const current = entries.get(key);
      const next = current === "true" ? "false" : "true";
      await handleValueChange(key, next);
    },
    [entries, handleValueChange],
  );

  const renderField = (def: ConfigKeyDef) => {
    const value = entries.get(def.key) ?? "";

    if (def.type === "toggle") {
      return (
        <button
          type="button"
          className={`settings-toggle${value === "true" ? " active" : ""}`}
          onClick={() => handleToggle(def.key)}
        >
          <div className="settings-toggle-knob" />
        </button>
      );
    }

    const fieldId = `gitconfig-${def.key.replace(/\./g, "-")}`;

    if (def.type === "select" && def.options) {
      return (
        <select
          id={fieldId}
          className="modal-select"
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            handleValueChange(def.key, e.target.value)
          }
        >
          {!def.options.includes(value) && <option value="">(not set)</option>}
          {def.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <DeferredInput
        id={fieldId}
        value={value}
        placeholder={def.placeholder}
        onCommit={(v) => handleValueChange(def.key, v)}
      />
    );
  };

  return (
    <div className="settings-tab">
      <div className="gitconfig-scope-bar">
        <div className="gitconfig-scope-toggle">
          <button
            type="button"
            className={`gitconfig-scope-btn${scope === "local" ? " active" : ""}`}
            onClick={() => handleScopeChange("local")}
          >
            Local
          </button>
          <button
            type="button"
            className={`gitconfig-scope-btn${scope === "global" ? " active" : ""}`}
            onClick={() => handleScopeChange("global")}
          >
            Global
          </button>
        </div>
        <span className="gitconfig-scope-path">{configPath}</span>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="settings-section">
          <h3>{section.title}</h3>
          {section.keys.map((def) => (
            <div key={def.key} className="gitconfig-row">
              <label
                className="gitconfig-key"
                htmlFor={`gitconfig-${def.key.replace(/\./g, "-")}`}
              >
                {def.key}
              </label>
              {renderField(def)}
            </div>
          ))}
        </div>
      ))}

      {aliases.length > 0 && (
        <div className="settings-section">
          <h3>Aliases</h3>
          <div className="gitconfig-alias-list">
            {aliases.map((alias) => (
              <div key={alias.key} className="gitconfig-alias-row">
                <span className="gitconfig-alias-name">{alias.key}</span>
                <span className="gitconfig-alias-value">{alias.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
