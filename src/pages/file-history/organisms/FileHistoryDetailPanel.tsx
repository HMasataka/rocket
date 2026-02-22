import type { CommitDetail } from "../../../services/history";
import { formatAbsoluteDate, formatRelativeDate } from "../../../utils/date";

interface FileHistoryDetailPanelProps {
  detail: CommitDetail | null;
}

export function FileHistoryDetailPanel({
  detail,
}: FileHistoryDetailPanelProps) {
  if (!detail) {
    return (
      <div className="fh-detail-panel">
        <div className="history-empty">Select a commit to view details</div>
      </div>
    );
  }

  const { info, files, stats } = detail;

  return (
    <div className="fh-detail-panel">
      <div className="fh-detail-info">
        <div className="fh-detail-commit-row">
          <div className="fh-detail-avatar">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
            </svg>
          </div>
          <div className="fh-detail-author-block">
            <div className="fh-detail-author">{info.author_name}</div>
            <div className="fh-detail-email">{info.author_email}</div>
          </div>
          <div className="fh-detail-date-block">
            <div className="fh-detail-date-relative">
              {formatRelativeDate(info.author_date)}
            </div>
            <div className="fh-detail-date-absolute">
              {formatAbsoluteDate(info.author_date)}
            </div>
          </div>
        </div>

        <div className="fh-detail-message">
          <div className="fh-detail-message-title">{info.message}</div>
          {info.body && (
            <div className="fh-detail-message-body">{info.body}</div>
          )}
        </div>

        <div className="fh-detail-hash-info">
          <span className="detail-label">Commit</span>
          <span className="fh-detail-full-hash">{info.oid}</span>
        </div>
      </div>

      <div className="fh-diff">
        <div className="fh-diff-header">
          <div className="fh-diff-stats-summary">
            <span className="stat-add">+{stats.additions}</span>
            <span className="stat-del">-{stats.deletions}</span>
          </div>
        </div>
        <div className="fh-diff-content">
          {files.map((file) => (
            <div key={file.path}>
              <div className="diff-preview-header">
                <span className="diff-preview-path">{file.path}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
