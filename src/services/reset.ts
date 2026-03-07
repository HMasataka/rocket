import { invoke } from "@tauri-apps/api/core";

export type ResetMode = "soft" | "mixed" | "hard";

export interface ResetResult {
  oid: string;
}

export function resetToCommit(
  tabId: string,
  oid: string,
  mode: ResetMode,
): Promise<ResetResult> {
  return invoke<ResetResult>("reset", { tabId, oid, mode });
}

export function resetFile(
  tabId: string,
  path: string,
  oid: string,
): Promise<void> {
  return invoke<void>("reset_file", { tabId, path, oid });
}
