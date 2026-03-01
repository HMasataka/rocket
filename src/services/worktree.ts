import { invoke } from "@tauri-apps/api/core";

export interface WorktreeInfo {
  path: string;
  branch: string | null;
  head_oid: string | null;
  head_short_oid: string | null;
  is_main: boolean;
  is_clean: boolean;
}

export function listWorktrees(): Promise<WorktreeInfo[]> {
  return invoke<WorktreeInfo[]>("list_worktrees");
}

export function addWorktree(path: string, branch: string): Promise<void> {
  return invoke<void>("add_worktree", { path, branch });
}

export function removeWorktree(path: string): Promise<void> {
  return invoke<void>("remove_worktree", { path });
}
