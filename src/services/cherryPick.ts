import { invoke } from "@tauri-apps/api/core";

export type CherryPickMode = "normal" | "no_commit" | "merge";

export interface CherryPickResult {
  completed: boolean;
  conflicts: string[];
  oid: string | null;
}

export function cherryPick(
  tabId: string,
  oids: string[],
  mode: CherryPickMode,
): Promise<CherryPickResult> {
  return invoke<CherryPickResult>("cherry_pick", { tabId, oids, mode });
}

export function isCherryPicking(tabId: string): Promise<boolean> {
  return invoke<boolean>("is_cherry_picking", { tabId });
}

export function abortCherryPick(tabId: string): Promise<void> {
  return invoke<void>("abort_cherry_pick", { tabId });
}

export function continueCherryPick(tabId: string): Promise<CherryPickResult> {
  return invoke<CherryPickResult>("continue_cherry_pick", { tabId });
}
