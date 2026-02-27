import { describe, expect, it } from "vitest";
import type { CliAdapterInfo } from "../../../services/ai";
import {
  findFirstAvailableIndex,
  sortAdaptersByPriority,
} from "../providerPriority";

const claude: CliAdapterInfo = {
  name: "Claude Code",
  command: "claude",
  available: true,
};
const llm: CliAdapterInfo = {
  name: "LLM CLI",
  command: "llm",
  available: false,
};
const aider: CliAdapterInfo = {
  name: "Aider",
  command: "aider",
  available: true,
};
const codex: CliAdapterInfo = {
  name: "Codex CLI",
  command: "codex",
  available: false,
};

describe("sortAdaptersByPriority", () => {
  it("returns adapters in provider_priority order", () => {
    const adapters = [claude, llm, aider];
    const priority = ["Aider", "LLM CLI", "Claude Code"];

    const result = sortAdaptersByPriority(adapters, priority);

    expect(result.map((a) => a.name)).toEqual([
      "Aider",
      "LLM CLI",
      "Claude Code",
    ]);
  });

  it("returns original order when priority is empty", () => {
    const adapters = [claude, llm, aider];

    const result = sortAdaptersByPriority(adapters, []);

    expect(result).toBe(adapters);
  });

  it("appends adapters not in priority to the end", () => {
    const adapters = [claude, llm, aider, codex];
    const priority = ["Aider"];

    const result = sortAdaptersByPriority(adapters, priority);

    expect(result[0].name).toBe("Aider");
    expect(result.length).toBe(4);
    expect(result.slice(1).map((a) => a.name)).toEqual([
      "Claude Code",
      "LLM CLI",
      "Codex CLI",
    ]);
  });

  it("ignores priority names that do not match any adapter", () => {
    const adapters = [claude, llm];
    const priority = ["NonExistent", "Claude Code"];

    const result = sortAdaptersByPriority(adapters, priority);

    expect(result.map((a) => a.name)).toEqual(["Claude Code", "LLM CLI"]);
  });
});

describe("findFirstAvailableIndex", () => {
  it("returns the index of the first available adapter", () => {
    const adapters = [llm, codex, aider, claude];

    expect(findFirstAvailableIndex(adapters)).toBe(2);
  });

  it("returns 0 when the first adapter is available", () => {
    const adapters = [claude, llm, aider];

    expect(findFirstAvailableIndex(adapters)).toBe(0);
  });

  it("returns -1 when no adapter is available", () => {
    const adapters = [llm, codex];

    expect(findFirstAvailableIndex(adapters)).toBe(-1);
  });

  it("returns -1 for an empty list", () => {
    expect(findFirstAvailableIndex([])).toBe(-1);
  });
});
