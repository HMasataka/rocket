import { invoke } from "@tauri-apps/api/core";

export type GitConfigScope = "local" | "global";

export interface GitConfigEntry {
  key: string;
  value: string;
}

export function getGitconfigEntries(
  tabId: string,
  scope: GitConfigScope,
): Promise<GitConfigEntry[]> {
  return invoke<GitConfigEntry[]>("get_gitconfig_entries", { tabId, scope });
}

export function getGitconfigValue(
  tabId: string,
  scope: GitConfigScope,
  key: string,
): Promise<string | null> {
  return invoke<string | null>("get_gitconfig_value", { tabId, scope, key });
}

export function setGitconfigValue(
  tabId: string,
  scope: GitConfigScope,
  key: string,
  value: string,
): Promise<void> {
  return invoke<void>("set_gitconfig_value", { tabId, scope, key, value });
}

export function unsetGitconfigValue(
  tabId: string,
  scope: GitConfigScope,
  key: string,
): Promise<void> {
  return invoke<void>("unset_gitconfig_value", { tabId, scope, key });
}

export function getGitconfigPath(
  tabId: string,
  scope: GitConfigScope,
): Promise<string> {
  return invoke<string>("get_gitconfig_path", { tabId, scope });
}
