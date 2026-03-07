import { invoke } from "@tauri-apps/api/core";
import type { FileDiff } from "./git";

export interface StashEntry {
  index: number;
  message: string;
  branch_name: string;
  author_date: number;
}

export function stashSave(
  tabId: string,
  message: string | null,
): Promise<void> {
  return invoke<void>("stash_save", { tabId, message });
}

export function listStashes(tabId: string): Promise<StashEntry[]> {
  return invoke<StashEntry[]>("list_stashes", { tabId });
}

export function applyStash(tabId: string, index: number): Promise<void> {
  return invoke<void>("apply_stash", { tabId, index });
}

export function popStash(tabId: string, index: number): Promise<void> {
  return invoke<void>("pop_stash", { tabId, index });
}

export function dropStash(tabId: string, index: number): Promise<void> {
  return invoke<void>("drop_stash", { tabId, index });
}

export function getStashDiff(
  tabId: string,
  index: number,
): Promise<FileDiff[]> {
  return invoke<FileDiff[]>("get_stash_diff", { tabId, index });
}
