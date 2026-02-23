import { invoke } from "@tauri-apps/api/core";
import type { CommitResult } from "./git";

export interface ConflictBlock {
  ours: string;
  theirs: string;
  start_line: number;
  end_line: number;
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

export function getConflictFiles(): Promise<ConflictFile[]> {
  return invoke<ConflictFile[]>("get_conflict_files");
}

export function resolveConflict(
  path: string,
  resolution: ConflictResolution,
): Promise<void> {
  return invoke<void>("resolve_conflict", { path, resolution });
}

export function resolveConflictBlock(
  path: string,
  blockIndex: number,
  resolution: ConflictResolution,
): Promise<void> {
  return invoke<void>("resolve_conflict_block", {
    path,
    blockIndex,
    resolution,
  });
}

export function markResolved(path: string): Promise<void> {
  return invoke<void>("mark_resolved", { path });
}

export function abortMerge(): Promise<void> {
  return invoke<void>("abort_merge");
}

export function continueMerge(message: string): Promise<CommitResult> {
  return invoke<CommitResult>("continue_merge", { message });
}

export function isMerging(): Promise<boolean> {
  return invoke<boolean>("is_merging");
}
