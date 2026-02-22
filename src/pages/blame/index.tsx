import { useEffect, useMemo } from "react";
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
            title="Back to History"
            onClick={() => setActivePage("history")}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
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
