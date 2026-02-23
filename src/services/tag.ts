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

export function listTags(): Promise<TagInfo[]> {
  return invoke<TagInfo[]>("list_tags");
}

export function createTag(name: string, message: string | null): Promise<void> {
  return invoke<void>("create_tag", { name, message });
}

export function deleteTag(name: string): Promise<void> {
  return invoke<void>("delete_tag", { name });
}

export function checkoutTag(name: string): Promise<void> {
  return invoke<void>("checkout_tag", { name });
}
