import { invoke } from "@tauri-apps/api/core";

export type GitConfigScope = "local" | "global";

export interface GitConfigEntry {
  key: string;
  value: string;
}

export function getGitconfigEntries(
  scope: GitConfigScope,
): Promise<GitConfigEntry[]> {
  return invoke<GitConfigEntry[]>("get_gitconfig_entries", { scope });
}

export function getGitconfigValue(
  scope: GitConfigScope,
  key: string,
): Promise<string | null> {
  return invoke<string | null>("get_gitconfig_value", { scope, key });
}

export function setGitconfigValue(
  scope: GitConfigScope,
  key: string,
  value: string,
): Promise<void> {
  return invoke<void>("set_gitconfig_value", { scope, key, value });
}

export function unsetGitconfigValue(
  scope: GitConfigScope,
  key: string,
): Promise<void> {
  return invoke<void>("unset_gitconfig_value", { scope, key });
}

export function getGitconfigPath(scope: GitConfigScope): Promise<string> {
  return invoke<string>("get_gitconfig_path", { scope });
}
