import { invoke } from "@tauri-apps/api/core";

export type SubmoduleStatus =
  | "up_to_date"
  | "modified"
  | "uninitialized"
  | "conflict";

export interface SubmoduleInfo {
  path: string;
  url: string;
  branch: string | null;
  head_oid: string | null;
  head_short_oid: string | null;
  status: SubmoduleStatus;
}

export function listSubmodules(): Promise<SubmoduleInfo[]> {
  return invoke<SubmoduleInfo[]>("list_submodules");
}

export function addSubmodule(url: string, path: string): Promise<void> {
  return invoke<void>("add_submodule", { url, path });
}

export function updateSubmodule(path: string): Promise<void> {
  return invoke<void>("update_submodule", { path });
}

export function updateAllSubmodules(): Promise<void> {
  return invoke<void>("update_all_submodules");
}

export function removeSubmodule(path: string): Promise<void> {
  return invoke<void>("remove_submodule", { path });
}
