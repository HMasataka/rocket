import type { LogFilter } from "../services/history";

export function activeFilterCount(filter: LogFilter): number {
  let count = 0;
  if (filter.author) count++;
  if (filter.since) count++;
  if (filter.until) count++;
  if (filter.message) count++;
  if (filter.path) count++;
  return count;
}
