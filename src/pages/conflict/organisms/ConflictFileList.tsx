import type { ConflictFile } from "../../../services/conflict";
import { ConflictFileItem } from "../molecules/ConflictFileItem";

interface ConflictFileListProps {
  files: ConflictFile[];
  selectedPath: string | null;
  resolvedPaths: Set<string>;
  onSelectFile: (path: string) => void;
}

export function ConflictFileList({
  files,
  selectedPath,
  resolvedPaths,
  onSelectFile,
}: ConflictFileListProps) {
  return (
    <div className="conflict-file-list">
      {files.map((file) => (
        <ConflictFileItem
          key={file.path}
          file={file}
          isSelected={selectedPath === file.path}
          isResolved={resolvedPaths.has(file.path)}
          onSelect={onSelectFile}
        />
      ))}
    </div>
  );
}
