import type { FileDiff } from "../../../services/git";
import type { CommitDetail } from "../../../services/history";
import { formatAbsoluteDate, formatRelativeDate } from "../../../utils/date";
import { CommitFileDiff } from "../molecules/CommitFileDiff";
import { CommitFileItem } from "../molecules/CommitFileItem";

interface CommitDetailPanelProps {
  detail: CommitDetail | null;
  expandedFileDiffs: Record<string, FileDiff[]>;
  onToggleFile: (path: string) => void;
  onOpenBlame: (path: string, commitOid: string) => void;
  onOpenFileHistory: (path: string) => void;
}

export function CommitDetailPanel({
  detail,
  expandedFileDiffs,
  onToggleFile,
  onOpenBlame,
  onOpenFileHistory,
}: CommitDetailPanelProps) {
  if (!detail) {
    return (
      <div className="commit-detail-panel">
        <div className="commit-detail">
          <div className="history-empty">Select a commit to view details</div>
        </div>
      </div>
    );
  }

  const { info, files, stats } = detail;

  return (
    <div className="commit-detail-panel">
      <div className="commit-detail">
        <div className="detail-header">
          <div className="detail-avatar">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
            </svg>
          </div>
          <div className="detail-author-info">
            <div className="detail-author">{info.author_name}</div>
            <div className="detail-author-email">{info.author_email}</div>
          </div>
          <div className="detail-date">
            <div className="detail-date-relative">
              {formatRelativeDate(info.author_date)}
            </div>
            <div className="detail-date-absolute">
              {formatAbsoluteDate(info.author_date)}
            </div>
          </div>
        </div>

        <div className="detail-commit-info">
          <div className="detail-hash-row">
            <span className="detail-label">Commit</span>
            <span className="detail-hash">{info.oid}</span>
          </div>
          {info.parent_oids.length > 0 && (
            <div className="detail-parent-row">
              <span className="detail-label">Parent</span>
              <span className="detail-parent-hash">
                {info.parent_oids.map((p) => p.slice(0, 7)).join(", ")}
              </span>
            </div>
          )}
        </div>

        <div className="detail-message-section">
          <div className="detail-message-title">{info.message}</div>
          {info.body && <div className="detail-message-body">{info.body}</div>}
        </div>

        <div className="detail-stats">
          <div className="stat-item additions">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            <span>{stats.additions} additions</span>
          </div>
          <div className="stat-item deletions">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
            </svg>
            <span>{stats.deletions} deletions</span>
          </div>
          <div className="stat-item files">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.414A2 2 0 0 0 13.414 3L11 .586A2 2 0 0 0 9.586 0H4zm5.5 1.5v2a1 1 0 0 0 1 1h2l-3-3z" />
            </svg>
            <span>{stats.files_changed} files changed</span>
          </div>
        </div>

        <div className="detail-files">
          <div className="section-header">
            <span className="section-title">Changed Files</span>
            <span className="section-count">{files.length}</span>
          </div>
          <div className="unified-files-list">
            {files.map((file) => {
              const isExpanded = file.path in expandedFileDiffs;
              return (
                <div key={file.path}>
                  <CommitFileItem
                    file={file}
                    isExpanded={isExpanded}
                    onToggle={onToggleFile}
                  />
                  {isExpanded && expandedFileDiffs[file.path] && (
                    <div>
                      <CommitFileDiff
                        path={file.path}
                        diffs={expandedFileDiffs[file.path]}
                      />
                      <div className="detail-file-actions">
                        <button
                          type="button"
                          className="detail-file-action-btn"
                          onClick={() => onOpenBlame(file.path, info.oid)}
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            role="presentation"
                          >
                            <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.414A2 2 0 0 0 13.414 3L11 .586A2 2 0 0 0 9.586 0H4zm5.5 1.5v2a1 1 0 0 0 1 1h2l-3-3zM4.5 8a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                          </svg>
                          Blame
                        </button>
                        <button
                          type="button"
                          className="detail-file-action-btn"
                          onClick={() => onOpenFileHistory(file.path)}
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            role="presentation"
                          >
                            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 1 1-7.73 5.946l.929.358A7 7 0 1 0 8.515 1.02z" />
                            <path d="M8 4.5a.5.5 0 0 0-1 0V8a.5.5 0 0 0 .146.354l2 2a.5.5 0 0 0 .708-.708L8 7.793V4.5z" />
                            <path d="M.146 4.854a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 4H4.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 1 1-.708.708l-2-2z" />
                          </svg>
                          History
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
