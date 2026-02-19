import { useState } from "react";
import type { FileStatus, StagingState } from "../../../services/git";
import { FileItem } from "./FileItem";

interface FileSectionProps {
  title: string;
  files: FileStatus[];
  selectedFile: string | null;
  selectedFileStaged: boolean;
  onSelectFile: (path: string, staged: boolean) => void;
  onFileAction: (path: string, staging: StagingState) => void;
}

export function FileSection({
  title,
  files,
  selectedFile,
  selectedFileStaged,
  onSelectFile,
  onFileAction,
}: FileSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

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
              onSelect={onSelectFile}
              onAction={onFileAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
