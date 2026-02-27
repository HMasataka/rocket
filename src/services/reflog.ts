import { invoke } from "@tauri-apps/api/core";

export interface ReflogEntry {
  index: number;
  old_oid: string;
  new_oid: string;
  new_short_oid: string;
  action: string;
  message: string;
  committer_name: string;
  committer_date: number;
}

export function getReflog(
  refName: string,
  limit: number,
): Promise<ReflogEntry[]> {
  return invoke<ReflogEntry[]>("get_reflog", {
    refName,
    limit,
  });
}
