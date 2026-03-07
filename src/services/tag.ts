import { invoke } from "@tauri-apps/api/core";

export interface TagInfo {
  name: string;
  target_oid: string;
  target_short_oid: string;
  is_annotated: boolean;
  tagger_name: string | null;
  tagger_date: number | null;
  message: string | null;
}

export function listTags(tabId: string): Promise<TagInfo[]> {
  return invoke<TagInfo[]>("list_tags", { tabId });
}

export function createTag(
  tabId: string,
  name: string,
  message: string | null,
): Promise<void> {
  return invoke<void>("create_tag", { tabId, name, message });
}

export function deleteTag(tabId: string, name: string): Promise<void> {
  return invoke<void>("delete_tag", { tabId, name });
}

export function checkoutTag(tabId: string, name: string): Promise<void> {
  return invoke<void>("checkout_tag", { tabId, name });
}
