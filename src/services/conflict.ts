import { invoke } from "@tauri-apps/api/core";
import type { CommitResult } from "./git";

export interface ConflictBlock {
  ours: string;
  base: string | null;
  theirs: string;
  start_line: number;
  end_line: number;
}

export interface MergeBaseContent {
  path: string;
  base_content: string | null;
  ours_content: string;
  theirs_content: string;
}

export interface ConflictFile {
  path: string;
  conflict_count: number;
  conflicts: ConflictBlock[];
}

export type ConflictResolution =
  | { type: "Ours" }
  | { type: "Theirs" }
  | { type: "Both" }
  | { type: "Manual"; content: string };

export function getConflictFiles(tabId: string): Promise<ConflictFile[]> {
  return invoke<ConflictFile[]>("get_conflict_files", { tabId });
}

export function resolveConflict(
  tabId: string,
  path: string,
  resolution: ConflictResolution,
): Promise<void> {
  return invoke<void>("resolve_conflict", { tabId, path, resolution });
}

export function resolveConflictBlock(
  tabId: string,
  path: string,
  blockIndex: number,
  resolution: ConflictResolution,
): Promise<void> {
  return invoke<void>("resolve_conflict_block", {
    tabId,
    path,
    blockIndex,
    resolution,
  });
}

export function markResolved(tabId: string, path: string): Promise<void> {
  return invoke<void>("mark_resolved", { tabId, path });
}

export function abortMerge(tabId: string): Promise<void> {
  return invoke<void>("abort_merge", { tabId });
}

export function continueMerge(
  tabId: string,
  message: string,
): Promise<CommitResult> {
  return invoke<CommitResult>("continue_merge", { tabId, message });
}

export function isMerging(tabId: string): Promise<boolean> {
  return invoke<boolean>("is_merging", { tabId });
}

export function getMergeBaseContent(
  tabId: string,
  path: string,
): Promise<MergeBaseContent> {
  return invoke<MergeBaseContent>("get_merge_base_content", { tabId, path });
}
