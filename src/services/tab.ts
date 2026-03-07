import { invoke } from "@tauri-apps/api/core";

export interface TabInfo {
  id: string;
  name: string;
  path: string;
}

export function openTab(path: string, tabId: string): Promise<void> {
  return invoke<void>("open_tab", { path, tabId });
}

export function closeTab(tabId: string): Promise<void> {
  return invoke<void>("close_tab", { tabId });
}

export function setActiveTab(tabId: string): Promise<void> {
  return invoke<void>("set_active_tab", { tabId });
}

export function listTabs(): Promise<TabInfo[]> {
  return invoke<TabInfo[]>("list_tabs");
}

export function getActiveTab(): Promise<string | null> {
  return invoke<string | null>("get_active_tab");
}
