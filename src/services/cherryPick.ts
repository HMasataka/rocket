import { invoke } from "@tauri-apps/api/core";

export type CherryPickMode = "normal" | "no_commit" | "merge";

export interface CherryPickResult {
  completed: boolean;
  conflicts: string[];
  oid: string | null;
}

export function cherryPick(
  oids: string[],
  mode: CherryPickMode,
): Promise<CherryPickResult> {
  return invoke<CherryPickResult>("cherry_pick", { oids, mode });
}

export function isCherryPicking(): Promise<boolean> {
  return invoke<boolean>("is_cherry_picking");
}

export function abortCherryPick(): Promise<void> {
  return invoke<void>("abort_cherry_pick");
}

export function continueCherryPick(): Promise<CherryPickResult> {
  return invoke<CherryPickResult>("continue_cherry_pick");
}
