import { invoke } from "@tauri-apps/api/core";

export type FileStatusKind =
  | "untracked"
  | "modified"
  | "deleted"
  | "renamed"
  | "typechange";

export type StagingState = "unstaged" | "staged";

export interface FileStatus {
  path: string;
  kind: FileStatusKind;
  staging: StagingState;
}

export interface RepoStatus {
  files: FileStatus[];
}

export type DiffLineKind =
  | "context"
  | "addition"
  | "deletion"
  | "fileheader"
  | "hunkheader";

export interface DiffLine {
  kind: DiffLineKind;
  content: string;
  old_lineno: number | null;
  new_lineno: number | null;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface FileDiff {
  old_path: string | null;
  new_path: string | null;
  hunks: DiffHunk[];
}

export interface CommitResult {
  oid: string;
}

export function getStatus(): Promise<RepoStatus> {
  return invoke<RepoStatus>("get_status");
}

export function getDiff(
  path: string | null,
  staged: boolean,
): Promise<FileDiff[]> {
  return invoke<FileDiff[]>("get_diff", { path, staged });
}

export function stageFile(path: string): Promise<void> {
  return invoke<void>("stage_file", { path });
}

export function unstageFile(path: string): Promise<void> {
  return invoke<void>("unstage_file", { path });
}

export function stageAll(): Promise<void> {
  return invoke<void>("stage_all");
}

export function unstageAll(): Promise<void> {
  return invoke<void>("unstage_all");
}

export function commitChanges(message: string): Promise<CommitResult> {
  return invoke<CommitResult>("commit", { message });
}

export function getCurrentBranch(): Promise<string> {
  return invoke<string>("get_current_branch");
}
