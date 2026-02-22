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

export interface BranchInfo {
  name: string;
  is_head: boolean;
}

export type MergeKind = "fast_forward" | "normal" | "up_to_date";

export interface MergeResult {
  kind: MergeKind;
  oid: string | null;
}

export type MergeOption = "default" | "fast_forward_only" | "no_fast_forward";

export function listBranches(): Promise<BranchInfo[]> {
  return invoke<BranchInfo[]>("list_branches");
}

export function createBranch(name: string): Promise<void> {
  return invoke<void>("create_branch", { name });
}

export function checkoutBranch(name: string): Promise<void> {
  return invoke<void>("checkout_branch", { name });
}

export function deleteBranch(name: string): Promise<void> {
  return invoke<void>("delete_branch", { name });
}

export function renameBranch(oldName: string, newName: string): Promise<void> {
  return invoke<void>("rename_branch", { oldName, newName });
}

export function mergeBranch(
  branchName: string,
  option: MergeOption,
): Promise<MergeResult> {
  return invoke<MergeResult>("merge_branch", { branchName, option });
}
