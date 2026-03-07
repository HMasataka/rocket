import { invoke } from "@tauri-apps/api/core";

export interface RecentRepo {
  path: string;
  name: string;
  last_opened: string;
}

export function openRepository(path: string): Promise<void> {
  return invoke<void>("open_repository", { path });
}

export function initRepository(
  path: string,
  gitignoreTemplate?: string,
): Promise<void> {
  return invoke<void>("init_repository", {
    path,
    gitignoreTemplate: gitignoreTemplate || null,
  });
}

export function cloneRepository(url: string, path: string): Promise<void> {
  return invoke<void>("clone_repository", { url, path });
}

export function getRecentRepos(): Promise<RecentRepo[]> {
  return invoke<RecentRepo[]>("get_recent_repos");
}

export function removeRecentRepo(path: string): Promise<void> {
  return invoke<void>("remove_recent_repo", { path });
}
