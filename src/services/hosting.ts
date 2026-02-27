import { invoke } from "@tauri-apps/api/core";

export interface HostingInfo {
  provider: string;
  owner: string;
  repo: string;
  url: string;
}

export interface PrLabel {
  name: string;
  color: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  head_branch: string;
  base_branch: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  labels: PrLabel[];
  additions: number;
  deletions: number;
  changed_files: number;
  body: string;
  url: string;
}

export interface Reviewer {
  login: string;
  state: string;
}

export interface CiCheck {
  name: string;
  status: string;
  description: string;
  elapsed: string;
  url: string;
}

export interface PrDetail {
  pull_request: PullRequest;
  checks: CiCheck[];
  reviewers: Reviewer[];
}

export interface Issue {
  number: number;
  title: string;
  state: string;
  author: string;
  labels: PrLabel[];
  created_at: string;
  url: string;
}

export function detectHostingProvider(): Promise<HostingInfo> {
  return invoke<HostingInfo>("detect_hosting_provider");
}

export function listPullRequests(): Promise<PullRequest[]> {
  return invoke<PullRequest[]>("list_pull_requests");
}

export function getPullRequestDetail(number: number): Promise<PrDetail> {
  return invoke<PrDetail>("get_pull_request_detail", { number });
}

export function listIssues(): Promise<Issue[]> {
  return invoke<Issue[]>("list_issues");
}

export function getDefaultBranch(): Promise<string> {
  return invoke<string>("get_default_branch");
}

export function createPullRequestUrl(
  head: string,
  base: string,
): Promise<string> {
  return invoke<string>("create_pull_request_url", { head, base });
}

export function openInBrowser(url: string): Promise<void> {
  return invoke<void>("open_in_browser", { url });
}
