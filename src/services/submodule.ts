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

export function listSubmodules(tabId: string): Promise<SubmoduleInfo[]> {
  return invoke<SubmoduleInfo[]>("list_submodules", { tabId });
}

export function addSubmodule(
  tabId: string,
  url: string,
  path: string,
): Promise<void> {
  return invoke<void>("add_submodule", { tabId, url, path });
}

export function updateSubmodule(tabId: string, path: string): Promise<void> {
  return invoke<void>("update_submodule", { tabId, path });
}

export function updateAllSubmodules(tabId: string): Promise<void> {
  return invoke<void>("update_all_submodules", { tabId });
}

export function removeSubmodule(tabId: string, path: string): Promise<void> {
  return invoke<void>("remove_submodule", { tabId, path });
}
