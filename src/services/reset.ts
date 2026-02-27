import { invoke } from "@tauri-apps/api/core";

export type ResetMode = "soft" | "mixed" | "hard";

export interface ResetResult {
  oid: string;
}

export function resetToCommit(
  oid: string,
  mode: ResetMode,
): Promise<ResetResult> {
  return invoke<ResetResult>("reset", { oid, mode });
}

export function resetFile(path: string, oid: string): Promise<void> {
  return invoke<void>("reset_file", { path, oid });
}
