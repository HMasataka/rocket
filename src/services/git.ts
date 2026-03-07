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

export function getStatus(tabId: string): Promise<RepoStatus> {
  return invoke<RepoStatus>("get_status", { tabId });
}

export function getDiff(
  tabId: string,
  path: string | null,
  staged: boolean,
): Promise<FileDiff[]> {
  return invoke<FileDiff[]>("get_diff", { tabId, path, staged });
}

export function stageFile(tabId: string, path: string): Promise<void> {
  return invoke<void>("stage_file", { tabId, path });
}

export function unstageFile(tabId: string, path: string): Promise<void> {
  return invoke<void>("unstage_file", { tabId, path });
}

export function stageAll(tabId: string): Promise<void> {
  return invoke<void>("stage_all", { tabId });
}

export function unstageAll(tabId: string): Promise<void> {
  return invoke<void>("unstage_all", { tabId });
}

export function commitChanges(
  tabId: string,
  message: string,
  amend: boolean,
  sign: boolean,
): Promise<CommitResult> {
  return invoke<CommitResult>("commit", { tabId, message, amend, sign });
}

export function getCurrentBranch(tabId: string): Promise<string> {
  return invoke<string>("get_current_branch", { tabId });
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

export function listBranches(tabId: string): Promise<BranchInfo[]> {
  return invoke<BranchInfo[]>("list_branches", { tabId });
}

export function createBranch(tabId: string, name: string): Promise<void> {
  return invoke<void>("create_branch", { tabId, name });
}

export function checkoutBranch(tabId: string, name: string): Promise<void> {
  return invoke<void>("checkout_branch", { tabId, name });
}

export function deleteBranch(tabId: string, name: string): Promise<void> {
  return invoke<void>("delete_branch", { tabId, name });
}

export function renameBranch(
  tabId: string,
  oldName: string,
  newName: string,
): Promise<void> {
  return invoke<void>("rename_branch", { tabId, oldName, newName });
}

export function mergeBranch(
  tabId: string,
  branchName: string,
  option: MergeOption,
): Promise<MergeResult> {
  return invoke<MergeResult>("merge_branch", { tabId, branchName, option });
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

export function fetchRemote(
  tabId: string,
  remoteName: string,
): Promise<FetchResult> {
  return invoke<FetchResult>("fetch_remote", { tabId, remoteName });
}

export function pullRemote(
  tabId: string,
  remoteName: string,
  option: PullOption,
): Promise<MergeResult> {
  return invoke<MergeResult>("pull_remote", { tabId, remoteName, option });
}

export function pushRemote(
  tabId: string,
  remoteName: string,
): Promise<PushResult> {
  return invoke<PushResult>("push_remote", { tabId, remoteName });
}

export function listRemotes(tabId: string): Promise<RemoteInfo[]> {
  return invoke<RemoteInfo[]>("list_remotes", { tabId });
}

export function addRemote(
  tabId: string,
  name: string,
  url: string,
): Promise<void> {
  return invoke<void>("add_remote", { tabId, name, url });
}

export function removeRemote(tabId: string, name: string): Promise<void> {
  return invoke<void>("remove_remote", { tabId, name });
}

export function editRemote(
  tabId: string,
  name: string,
  newUrl: string,
): Promise<void> {
  return invoke<void>("edit_remote", { tabId, name, newUrl });
}

export function stageHunk(
  tabId: string,
  path: string,
  hunk: HunkIdentifier,
): Promise<void> {
  return invoke<void>("stage_hunk", { tabId, path, hunk });
}

export function unstageHunk(
  tabId: string,
  path: string,
  hunk: HunkIdentifier,
): Promise<void> {
  return invoke<void>("unstage_hunk", { tabId, path, hunk });
}

export function discardHunk(
  tabId: string,
  path: string,
  hunk: HunkIdentifier,
): Promise<void> {
  return invoke<void>("discard_hunk", { tabId, path, hunk });
}

export function stageLines(
  tabId: string,
  path: string,
  lineRange: LineRange,
): Promise<void> {
  return invoke<void>("stage_lines", { tabId, path, lineRange });
}

export function unstageLines(
  tabId: string,
  path: string,
  lineRange: LineRange,
): Promise<void> {
  return invoke<void>("unstage_lines", { tabId, path, lineRange });
}

export function discardLines(
  tabId: string,
  path: string,
  lineRange: LineRange,
): Promise<void> {
  return invoke<void>("discard_lines", { tabId, path, lineRange });
}

export function getHeadCommitMessage(tabId: string): Promise<string> {
  return invoke<string>("get_head_commit_message", { tabId });
}

export function getBranchCommits(
  tabId: string,
  branchName: string,
  limit: number,
): Promise<CommitInfo[]> {
  return invoke<CommitInfo[]>("get_branch_commits", {
    tabId,
    branchName,
    limit,
  });
}
