import { useCallback, useEffect, useState } from "react";
import type { FileDiff } from "../../../services/git";
import type { StashEntry } from "../../../services/stash";
import { getStashDiff } from "../../../services/stash";

interface StashDetailPanelProps {
  entry: StashEntry | null;
}

function inferFileStatus(diff: FileDiff): { label: string; className: string } {
  if (diff.old_path == null) {
    return { label: "A", className: "added" };
  }
  if (diff.new_path == null) {
    return { label: "D", className: "deleted" };
  }
  return { label: "M", className: "modified" };
}

function formatDate(timestamp: number): string {
  if (timestamp === 0) return "";
  return new Date(timestamp * 1000).toLocaleString();
}

export function StashDetailPanel({ entry }: StashDetailPanelProps) {
  const [diffs, setDiffs] = useState<FileDiff[]>([]);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  useEffect(() => {
    if (!entry) {
      setDiffs([]);
      setExpandedFile(null);
      return;
    }
    getStashDiff(entry.index)
      .then(setDiffs)
      .catch(() => setDiffs([]));
  }, [entry]);

  const toggleFile = useCallback((path: string) => {
    setExpandedFile((prev) => (prev === path ? null : path));
  }, []);

  if (!entry) {
    return (
      <div className="operation-right-panel">
        <div className="changes-preview">
          <div className="empty-state">
            <p>Select a stash to preview</p>
          </div>
        </div>
      </div>
    );
  }

  const totalAdditions = diffs.reduce(
    (sum, d) =>
      sum +
      d.hunks.reduce(
        (hs, h) => hs + h.lines.filter((l) => l.kind === "addition").length,
        0,
      ),
    0,
  );
  const totalDeletions = diffs.reduce(
    (sum, d) =>
      sum +
      d.hunks.reduce(
        (hs, h) => hs + h.lines.filter((l) => l.kind === "deletion").length,
        0,
      ),
    0,
  );

  return (
    <div className="operation-right-panel">
      <div className="changes-preview">
        <div className="preview-header">
          <div className="preview-commit-info">
            <span className="preview-hash stash">
              stash@{"{"}
              {entry.index}
              {"}"}
            </span>
            <div className="preview-message">{entry.message}</div>
            <span className="preview-author">
              {entry.branch_name && `${entry.branch_name} \u00B7 `}
              {formatDate(entry.author_date)}
            </span>
          </div>
        </div>

        <div className="preview-section">
          <div className="section-header">
            <span className="section-title">Changed Files</span>
            <span className="section-count">{diffs.length}</span>
          </div>
          <div className="preview-files-list">
            {diffs.map((d) => {
              const path = d.new_path ?? d.old_path ?? "";
              const isExpanded = expandedFile === path;
              const adds = d.hunks.reduce(
                (s, h) =>
                  s + h.lines.filter((l) => l.kind === "addition").length,
                0,
              );
              const dels = d.hunks.reduce(
                (s, h) =>
                  s + h.lines.filter((l) => l.kind === "deletion").length,
                0,
              );
              const fileStatus = inferFileStatus(d);

              return (
                <div key={path}>
                  <button
                    type="button"
                    className={`preview-file${isExpanded ? " expanded" : ""}`}
                    onClick={() => toggleFile(path)}
                  >
                    <span
                      className={`preview-file-status ${fileStatus.className}`}
                    >
                      {fileStatus.label}
                    </span>
                    <span className="preview-file-path">{path}</span>
                    <span className="preview-file-stats">
                      {adds > 0 && <span className="stat-add">+{adds}</span>}
                      {dels > 0 && <span className="stat-del">-{dels}</span>}
                    </span>
                    <span className="preview-file-expand">
                      <svg
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
                      </svg>
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="preview-file-diff">
                      <div className="diff-preview-content">
                        {d.hunks.map((h) => (
                          <div className="diff-hunk" key={h.header}>
                            <div className="diff-hunk-header">{h.header}</div>
                            {h.lines.map((line, li) => {
                              const lineClass =
                                line.kind === "addition"
                                  ? "add"
                                  : line.kind === "deletion"
                                    ? "del"
                                    : "context";
                              return (
                                <div
                                  className={`diff-line ${lineClass}`}
                                  key={`${h.header}-${li}`}
                                >
                                  <span className="line-num">
                                    {line.old_lineno ?? ""}
                                  </span>
                                  <span className="line-code">
                                    {line.content}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {diffs.length > 0 && (
          <div className="preview-stats-bar">
            <span className="stats-label">Impact</span>
            <div className="stats-visual">
              <div className="stats-bar">
                {totalAdditions > 0 && (
                  <div
                    className="stats-bar-add"
                    style={{
                      width: `${(totalAdditions / (totalAdditions + totalDeletions)) * 100}%`,
                    }}
                  />
                )}
                {totalDeletions > 0 && (
                  <div
                    className="stats-bar-del"
                    style={{
                      width: `${(totalDeletions / (totalAdditions + totalDeletions)) * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="stats-numbers">
                <span className="additions">+{totalAdditions}</span>
                <span className="deletions">-{totalDeletions}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
