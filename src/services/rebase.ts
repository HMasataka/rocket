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

export function rebase(onto: string): Promise<RebaseResult> {
  return invoke<RebaseResult>("rebase", { onto });
}

export function interactiveRebase(
  onto: string,
  todo: RebaseTodoEntry[],
): Promise<RebaseResult> {
  return invoke<RebaseResult>("interactive_rebase", { onto, todo });
}

export function isRebasing(): Promise<boolean> {
  return invoke<boolean>("is_rebasing");
}

export function abortRebase(): Promise<void> {
  return invoke<void>("abort_rebase");
}

export function continueRebase(): Promise<RebaseResult> {
  return invoke<RebaseResult>("continue_rebase");
}

export function getRebaseState(): Promise<RebaseState | null> {
  return invoke<RebaseState | null>("get_rebase_state");
}

export function getRebaseTodo(
  onto: string,
  limit: number,
): Promise<RebaseTodoEntry[]> {
  return invoke<RebaseTodoEntry[]>("get_rebase_todo", { onto, limit });
}
