import { invoke } from "@tauri-apps/api/core";

export interface RecentRepo {
  path: string;
  name: string;
  last_opened: string;
}

export function openRepository(path: string, tabId: string): Promise<void> {
  return invoke<void>("open_repository", { path, tabId });
}

export function initRepository(
  path: string,
  tabId: string,
  gitignoreTemplate?: string,
): Promise<void> {
  return invoke<void>("init_repository", {
    path,
    gitignoreTemplate: gitignoreTemplate || null,
    tabId,
  });
}

export function cloneRepository(
  url: string,
  path: string,
  tabId: string,
): Promise<void> {
  return invoke<void>("clone_repository", { url, path, tabId });
}

export function getRecentRepos(): Promise<RecentRepo[]> {
  return invoke<RecentRepo[]>("get_recent_repos");
}

export function removeRecentRepo(path: string): Promise<void> {
  return invoke<void>("remove_recent_repo", { path });
}
