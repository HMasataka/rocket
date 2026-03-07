import { useEffect, useState } from "react";
import type { CommitInfo } from "../services/history";
import { getCommitLog } from "../services/history";
import { DEFAULT_TAB_ID, useTabStore } from "../stores/tabStore";
import { useUIStore } from "../stores/uiStore";

const DEFAULT_LIMIT = 100;

const EMPTY_FILTER = {
  author: null,
  since: null,
  until: null,
  message: null,
  path: null,
};

export function useCommitLog(limit: number = DEFAULT_LIMIT) {
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const addToast = useUIStore((s) => s.addToast);
  const activeTabId = useTabStore((s) => s.activeTabId) ?? DEFAULT_TAB_ID;

  useEffect(() => {
    getCommitLog(activeTabId, EMPTY_FILTER, limit, 0)
      .then((result) => setCommits(result.commits))
      .catch((e: unknown) => addToast(String(e), "error"));
  }, [limit, addToast, activeTabId]);

  return commits;
}
