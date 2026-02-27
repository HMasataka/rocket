import { useMemo, useState } from "react";
import type { CommitInfo } from "../services/history";

export function useCommitSearch(commits: CommitInfo[]) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return commits;
    const lower = search.toLowerCase();
    return commits.filter(
      (c) =>
        c.message.toLowerCase().includes(lower) ||
        c.short_oid.includes(search) ||
        c.author_name.toLowerCase().includes(lower),
    );
  }, [commits, search]);

  return { search, setSearch, filtered } as const;
}
