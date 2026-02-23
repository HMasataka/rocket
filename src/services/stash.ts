import { invoke } from "@tauri-apps/api/core";
import type { FileDiff } from "./git";

export interface StashEntry {
  index: number;
  message: string;
  branch_name: string;
  author_date: number;
}

export function stashSave(message: string | null): Promise<void> {
  return invoke<void>("stash_save", { message });
}

export function listStashes(): Promise<StashEntry[]> {
  return invoke<StashEntry[]>("list_stashes");
}

export function applyStash(index: number): Promise<void> {
  return invoke<void>("apply_stash", { index });
}

export function popStash(index: number): Promise<void> {
  return invoke<void>("pop_stash", { index });
}

export function dropStash(index: number): Promise<void> {
  return invoke<void>("drop_stash", { index });
}

export function getStashDiff(index: number): Promise<FileDiff[]> {
  return invoke<FileDiff[]>("get_stash_diff", { index });
}
