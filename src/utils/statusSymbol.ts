import type { CommitFileStatus } from "../services/history";

export function statusSymbol(status: CommitFileStatus): {
  symbol: string;
  className: string;
} {
  switch (status) {
    case "added":
      return { symbol: "+", className: "added" };
    case "deleted":
      return { symbol: "-", className: "deleted" };
    case "modified":
      return { symbol: "~", className: "modified" };
    case "renamed":
      return { symbol: "R", className: "modified" };
  }
}
