import { useMemo, useState } from "react";
import type { ReviewComment } from "../../../services/ai";
import type { FileStatus, StagingState } from "../../../services/git";
import { FileItem } from "./FileItem";

interface FileSectionProps {
  title: string;
  files: FileStatus[];
  selectedFile: string | null;
  selectedFileStaged: boolean;
  reviewComments?: ReviewComment[];
  onSelectFile: (path: string, staged: boolean) => void;
  onFileAction: (path: string, staging: StagingState) => void;
}

export function FileSection({
  title,
  files,
  selectedFile,
  selectedFileStaged,
  reviewComments,
  onSelectFile,
  onFileAction,
}: FileSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const commentsByFile = useMemo(() => {
    if (!reviewComments || reviewComments.length === 0) return {};
    const map: Record<string, ReviewComment[]> = {};
    for (const comment of reviewComments) {
      if (!map[comment.file]) {
        map[comment.file] = [];
      }
      map[comment.file].push(comment);
    }
    return map;
  }, [reviewComments]);

  if (files.length === 0) return null;

  const isStaged = files[0].staging === "staged";

  return (
    <div className="file-section">
      <button
        type="button"
        className={`file-section-header${collapsed ? " collapsed" : ""}`}
        onClick={() => setCollapsed((c) => !c)}
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="chevron"
          aria-hidden="true"
        >
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
        </svg>
        <span>{title}</span>
        <span className="count">{files.length}</span>
      </button>
      {!collapsed && (
        <div className="file-list">
          {files.map((file) => (
            <FileItem
              key={`${file.staging}-${file.path}`}
              file={file}
              selected={
                selectedFile === file.path && selectedFileStaged === isStaged
              }
              reviewComments={commentsByFile[file.path]}
              onSelect={onSelectFile}
              onAction={onFileAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
