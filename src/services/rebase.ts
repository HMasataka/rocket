import { invoke } from "@tauri-apps/api/core";

export type RebaseAction =
  | "pick"
  | "reword"
  | "edit"
  | "squash"
  | "fixup"
  | "drop";

export interface RebaseTodoEntry {
  action: RebaseAction;
  oid: string;
  short_oid: string;
  message: string;
  author_name: string;
}

export interface RebaseState {
  onto_branch: string;
  onto_oid: string;
  current_step: number;
  total_steps: number;
  has_conflicts: boolean;
}

export interface RebaseResult {
  completed: boolean;
  conflicts: string[];
}

export function rebase(tabId: string, onto: string): Promise<RebaseResult> {
  return invoke<RebaseResult>("rebase", { tabId, onto });
}

export function interactiveRebase(
  tabId: string,
  onto: string,
  todo: RebaseTodoEntry[],
): Promise<RebaseResult> {
  return invoke<RebaseResult>("interactive_rebase", { tabId, onto, todo });
}

export function isRebasing(tabId: string): Promise<boolean> {
  return invoke<boolean>("is_rebasing", { tabId });
}

export function abortRebase(tabId: string): Promise<void> {
  return invoke<void>("abort_rebase", { tabId });
}

export function continueRebase(tabId: string): Promise<RebaseResult> {
  return invoke<RebaseResult>("continue_rebase", { tabId });
}

export function getRebaseState(tabId: string): Promise<RebaseState | null> {
  return invoke<RebaseState | null>("get_rebase_state", { tabId });
}

export function getRebaseTodo(
  tabId: string,
  onto: string,
  limit: number,
): Promise<RebaseTodoEntry[]> {
  return invoke<RebaseTodoEntry[]>("get_rebase_todo", { tabId, onto, limit });
}
