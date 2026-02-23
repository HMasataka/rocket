import type { CommitRefKind } from "../services/history";

export function refClass(kind: CommitRefKind): string {
  switch (kind) {
    case "head":
      return "commit-ref ref-head";
    case "local_branch":
      return "commit-ref ref-branch";
    case "remote_branch":
      return "commit-ref ref-remote";
    case "tag":
      return "commit-ref ref-version";
    default:
      return "commit-ref";
  }
}
