import { invoke } from "@tauri-apps/api/core";

export interface CodeSearchResult {
  file: string;
  line_number: number;
  content: string;
}

export interface CommitSearchResult {
  oid: string;
  short_oid: string;
  message: string;
  author_name: string;
  author_date: number;
}

export interface FilenameSearchResult {
  path: string;
}

export function searchCode(
  tabId: string,
  query: string,
  isRegex: boolean,
): Promise<CodeSearchResult[]> {
  return invoke<CodeSearchResult[]>("search_code", { tabId, query, isRegex });
}

export function searchCommits(
  tabId: string,
  query: string,
  searchDiff: boolean,
): Promise<CommitSearchResult[]> {
  return invoke<CommitSearchResult[]>("search_commits", {
    tabId,
    query,
    searchDiff,
  });
}

export function searchFilenames(
  tabId: string,
  query: string,
): Promise<FilenameSearchResult[]> {
  return invoke<FilenameSearchResult[]>("search_filenames", { tabId, query });
}
