import { invoke } from "@tauri-apps/api/core";
import type { FileDiff } from "./git";

export type CommitRefKind = "head" | "local_branch" | "remote_branch" | "tag";

export interface CommitRef {
  name: string;
  kind: CommitRefKind;
}

export type GraphNodeType = "normal" | "merge";

export interface GraphEdge {
  from_column: number;
  to_column: number;
  color_index: number;
}

export interface CommitGraphRow {
  oid: string;
  column: number;
  node_type: GraphNodeType;
  edges: GraphEdge[];
}

export interface CommitInfo {
  oid: string;
  short_oid: string;
  message: string;
  body: string;
  author_name: string;
  author_email: string;
  author_date: number;
  parent_oids: string[];
  refs: CommitRef[];
}

export type CommitFileStatus = "added" | "modified" | "deleted" | "renamed";

export interface CommitFileChange {
  path: string;
  status: CommitFileStatus;
  additions: number;
  deletions: number;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  files_changed: number;
}

export interface CommitDetail {
  info: CommitInfo;
  files: CommitFileChange[];
  stats: CommitStats;
}

export interface BlameLine {
  line_number: number;
  content: string;
  commit_oid: string;
  commit_short_oid: string;
  author_name: string;
  author_date: number;
  is_block_start: boolean;
}

export interface BlameResult {
  path: string;
  lines: BlameLine[];
}

export interface LogFilter {
  author: string | null;
  since: number | null;
  until: number | null;
  message: string | null;
  path: string | null;
}

export interface CommitLogResult {
  commits: CommitInfo[];
  graph: CommitGraphRow[];
}

export function getCommitLog(
  filter: LogFilter,
  limit: number,
  skip: number,
): Promise<CommitLogResult> {
  return invoke<CommitLogResult>("get_commit_log", { filter, limit, skip });
}

export function getCommitDetail(oid: string): Promise<CommitDetail> {
  return invoke<CommitDetail>("get_commit_detail", { oid });
}

export function getCommitFileDiff(
  oid: string,
  path: string,
): Promise<FileDiff[]> {
  return invoke<FileDiff[]>("get_commit_file_diff", { oid, path });
}

export function getBlame(
  path: string,
  commitOid: string | null,
): Promise<BlameResult> {
  return invoke<BlameResult>("get_blame", { path, commitOid });
}

export function getFileHistory(
  path: string,
  limit: number,
  skip: number,
): Promise<CommitInfo[]> {
  return invoke<CommitInfo[]>("get_file_history", { path, limit, skip });
}
