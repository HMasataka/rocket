import { invoke } from "@tauri-apps/api/core";

export interface WorktreeInfo {
  path: string;
  branch: string | null;
  head_oid: string | null;
  head_short_oid: string | null;
  is_main: boolean;
  is_clean: boolean;
}

export function listWorktrees(tabId: string): Promise<WorktreeInfo[]> {
  return invoke<WorktreeInfo[]>("list_worktrees", { tabId });
}

export function addWorktree(
  tabId: string,
  path: string,
  branch: string,
): Promise<void> {
  return invoke<void>("add_worktree", { tabId, path, branch });
}

export function removeWorktree(tabId: string, path: string): Promise<void> {
  return invoke<void>("remove_worktree", { tabId, path });
}
