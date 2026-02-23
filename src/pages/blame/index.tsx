import { useCallback, useEffect, useMemo } from "react";
import { useHistoryStore } from "../../stores/historyStore";
import { useUIStore } from "../../stores/uiStore";
import { BlameLineRow } from "./molecules/BlameLine";

export function BlamePage() {
  const blameTarget = useUIStore((s) => s.blameTarget);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const addToast = useUIStore((s) => s.addToast);
  const blameResult = useHistoryStore((s) => s.blameResult);
  const blameLoading = useHistoryStore((s) => s.blameLoading);
  const fetchBlame = useHistoryStore((s) => s.fetchBlame);
  const clearBlame = useHistoryStore((s) => s.clearBlame);

  useEffect(() => {
    if (!blameTarget) {
      setActivePage("history");
      return;
    }
    fetchBlame(blameTarget.path, blameTarget.commitOid).catch((e: unknown) => {
      addToast(String(e), "error");
    });
    return () => {
      clearBlame();
    };
  }, [blameTarget, fetchBlame, clearBlame, setActivePage, addToast]);

  const blockIndices = useMemo(() => {
    if (!blameResult) return [];
    let blockIndex = 0;
    return blameResult.lines.map((line) => {
      if (line.is_block_start) {
        blockIndex++;
      }
      return blockIndex;
    });
  }, [blameResult]);

  const handleCopyPath = useCallback(() => {
    if (!blameTarget) return;
    navigator.clipboard.writeText(blameTarget.path).then(() => {
      addToast("Path copied to clipboard", "success");
    });
  }, [blameTarget, addToast]);

  if (!blameTarget) return null;

  const pathParts = blameTarget.path.split("/");
  const fileName = pathParts.pop() ?? "";
  const dirPath = pathParts.length > 0 ? `${pathParts.join("/")}/` : "";

  return (
    <div className="blame-layout">
      <div className="blame-header">
        <div className="blame-file-info">
          <svg
            className="blame-file-icon"
            viewBox="0 0 16 16"
            fill="currentColor"
            role="presentation"
          >
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5z" />
          </svg>
          <div className="blame-file-path">
            <span className="blame-path-dir">{dirPath}</span>
            <span className="blame-path-name">{fileName}</span>
          </div>
          {blameResult && (
            <span className="blame-line-count">
              {blameResult.lines.length} lines
            </span>
          )}
        </div>
        <div className="blame-header-actions">
          <button
            type="button"
            className="icon-btn"
            title="View File"
            onClick={() => setActivePage("history")}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
              <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="File History"
            onClick={() => {
              const openFileHistory = useUIStore.getState().openFileHistory;
              openFileHistory(blameTarget.path);
            }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zM8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z" />
              <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Copy Path"
            onClick={handleCopyPath}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="blame-content">
        {blameLoading && <div className="history-empty">Loading blame...</div>}
        {!blameLoading && !blameResult && (
          <div className="history-empty">No blame data</div>
        )}
        {blameResult?.lines.map((line, i) => (
          <BlameLineRow
            key={line.line_number}
            line={line}
            blockIndex={blockIndices[i]}
          />
        ))}
      </div>
    </div>
  );
}
