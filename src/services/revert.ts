import { invoke } from "@tauri-apps/api/core";

export type RevertMode = "auto" | "no_commit" | "edit";

export interface RevertResult {
  completed: boolean;
  conflicts: string[];
  oid: string | null;
}

export function revertCommit(
  tabId: string,
  oid: string,
  mode: RevertMode,
): Promise<RevertResult> {
  return invoke<RevertResult>("revert", { tabId, oid, mode });
}

export function isReverting(tabId: string): Promise<boolean> {
  return invoke<boolean>("is_reverting", { tabId });
}

export function abortRevert(tabId: string): Promise<void> {
  return invoke<void>("abort_revert", { tabId });
}

export function continueRevert(tabId: string): Promise<RevertResult> {
  return invoke<RevertResult>("continue_revert", { tabId });
}
