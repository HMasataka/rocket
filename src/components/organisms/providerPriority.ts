import type { CliAdapterInfo } from "../../services/ai";

export function sortAdaptersByPriority(
  adapters: CliAdapterInfo[],
  priority: string[],
): CliAdapterInfo[] {
  if (priority.length === 0) return adapters;

  const adapterByName = new Map(adapters.map((a) => [a.name, a]));
  const sorted: CliAdapterInfo[] = [];
  for (const name of priority) {
    const adapter = adapterByName.get(name);
    if (adapter) {
      sorted.push(adapter);
      adapterByName.delete(name);
    }
  }
  for (const adapter of adapterByName.values()) {
    sorted.push(adapter);
  }
  return sorted;
}

export function findFirstAvailableIndex(adapters: CliAdapterInfo[]): number {
  return adapters.findIndex((a) => a.available);
}
