import { invoke } from "@tauri-apps/api/core";
import type { CommitInfo } from "./history";

export type FileStatusKind =
  | "untracked"
  | "modified"
  | "deleted"
  | "renamed"
  | "typechange"
  | "conflicted";

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

export interface WordSegment {
  text: string;
  highlighted: boolean;
}

export interface DiffLine {
  kind: DiffLineKind;
  content: string;
  old_lineno: number | null;
  new_lineno: number | null;
  word_diff: WordSegment[] | null;
}

export interface DiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

export interface HunkIdentifier {
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
}

export interface LineRange {
  hunk: HunkIdentifier;
  line_indices: number[];
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

export function commitChanges(
  message: string,
  amend: boolean,
): Promise<CommitResult> {
  return invoke<CommitResult>("commit", { message, amend });
}

export function getCurrentBranch(): Promise<string> {
  return invoke<string>("get_current_branch");
}

export interface BranchInfo {
  name: string;
  is_head: boolean;
  is_remote: boolean;
  remote_name: string | null;
  upstream: string | null;
  ahead_count: number;
  behind_count: number;
}

export type MergeKind =
  | "fast_forward"
  | "normal"
  | "rebase"
  | "up_to_date"
  | "conflict";

export interface MergeResult {
  kind: MergeKind;
  oid: string | null;
  conflicts: string[];
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

export interface RemoteInfo {
  name: string;
  url: string;
}

export interface FetchResult {
  remote_name: string;
}

export type PullOption = "merge" | "rebase";

export interface PushResult {
  remote_name: string;
  branch: string;
}

export function fetchRemote(remoteName: string): Promise<FetchResult> {
  return invoke<FetchResult>("fetch_remote", { remoteName });
}

export function pullRemote(
  remoteName: string,
  option: PullOption,
): Promise<MergeResult> {
  return invoke<MergeResult>("pull_remote", { remoteName, option });
}

export function pushRemote(remoteName: string): Promise<PushResult> {
  return invoke<PushResult>("push_remote", { remoteName });
}

export function listRemotes(): Promise<RemoteInfo[]> {
  return invoke<RemoteInfo[]>("list_remotes");
}

export function addRemote(name: string, url: string): Promise<void> {
  return invoke<void>("add_remote", { name, url });
}

export function removeRemote(name: string): Promise<void> {
  return invoke<void>("remove_remote", { name });
}

export function editRemote(name: string, newUrl: string): Promise<void> {
  return invoke<void>("edit_remote", { name, newUrl });
}

export function stageHunk(path: string, hunk: HunkIdentifier): Promise<void> {
  return invoke<void>("stage_hunk", { path, hunk });
}

export function unstageHunk(path: string, hunk: HunkIdentifier): Promise<void> {
  return invoke<void>("unstage_hunk", { path, hunk });
}

export function discardHunk(path: string, hunk: HunkIdentifier): Promise<void> {
  return invoke<void>("discard_hunk", { path, hunk });
}

export function stageLines(path: string, lineRange: LineRange): Promise<void> {
  return invoke<void>("stage_lines", { path, lineRange });
}

export function unstageLines(
  path: string,
  lineRange: LineRange,
): Promise<void> {
  return invoke<void>("unstage_lines", { path, lineRange });
}

export function discardLines(
  path: string,
  lineRange: LineRange,
): Promise<void> {
  return invoke<void>("discard_lines", { path, lineRange });
}

export function getHeadCommitMessage(): Promise<string> {
  return invoke<string>("get_head_commit_message");
}

export function getBranchCommits(
  branchName: string,
  limit: number,
): Promise<CommitInfo[]> {
  return invoke<CommitInfo[]>("get_branch_commits", { branchName, limit });
}
