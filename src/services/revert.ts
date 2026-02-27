import { invoke } from "@tauri-apps/api/core";

export type RevertMode = "auto" | "no_commit" | "edit";

export interface RevertResult {
  completed: boolean;
  conflicts: string[];
  oid: string | null;
}

export function revertCommit(
  oid: string,
  mode: RevertMode,
): Promise<RevertResult> {
  return invoke<RevertResult>("revert", { oid, mode });
}

export function isReverting(): Promise<boolean> {
  return invoke<boolean>("is_reverting");
}

export function abortRevert(): Promise<void> {
  return invoke<void>("abort_revert");
}

export function continueRevert(): Promise<RevertResult> {
  return invoke<RevertResult>("continue_revert");
}
