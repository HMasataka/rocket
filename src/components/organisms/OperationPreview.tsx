import type { CommitDetail } from "../../services/history";
import { formatRelativeDate } from "../../utils/date";
import { statusSymbol } from "../../utils/statusSymbol";

interface OperationPreviewProps {
  detail: CommitDetail | null;
  hashClassName: string;
}

export function OperationPreview({
  detail,
  hashClassName,
}: OperationPreviewProps) {
  if (!detail) {
    return (
      <div className="preview-empty">
        <p>Select a commit to preview changes</p>
      </div>
    );
  }

  const totalAdd = detail.stats.additions;
  const totalDel = detail.stats.deletions;
  const total = totalAdd + totalDel;
  const addPct = total > 0 ? (totalAdd / total) * 100 : 0;
  const delPct = total > 0 ? (totalDel / total) * 100 : 0;

  return (
    <div className="changes-preview">
      <div className="preview-header">
        <div className="preview-commit-info">
          <div className={`preview-hash ${hashClassName}`}>
            {detail.info.short_oid}
          </div>
          <div className="preview-message">{detail.info.message}</div>
          <div className="preview-author">
            {detail.info.author_name} ·{" "}
            {formatRelativeDate(detail.info.author_date)}
          </div>
        </div>
      </div>

      <div className="preview-section">
        <div className="section-header">
          <span className="section-title">Changed Files</span>
          <span className="section-count">{detail.files.length}</span>
        </div>
        <div className="preview-files-list">
          {detail.files.map((file) => {
            const st = statusSymbol(file.status);
            return (
              <div key={file.path} className="preview-file">
                <div className={`preview-file-status ${st.className}`}>
                  {st.symbol}
                </div>
                <div className="preview-file-path">{file.path}</div>
                <div className="preview-file-stats">
                  <span className="stat-add">+{file.additions}</span>
                  <span className="stat-del">-{file.deletions}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="preview-stats-bar">
        <div className="stats-label">Impact</div>
        <div className="stats-visual">
          <div className="stats-bar">
            <div className="stats-bar-add" style={{ width: `${addPct}%` }} />
            <div className="stats-bar-del" style={{ width: `${delPct}%` }} />
          </div>
          <div className="stats-numbers">
            <span className="additions">+{totalAdd}</span>
            <span className="deletions">-{totalDel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
