import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { useAiStore } from "../aiStore";

const mockedInvoke = vi.mocked(invoke);

describe("AI Settings integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAiStore.setState({
      adapters: [],
      generating: false,
      config: null,
      lastResult: null,
      error: null,
    });
  });

  describe("settings tab data flow", () => {
    it("loads config and adapters on initialization", async () => {
      const mockConfig = {
        commit_message_style: "conventional",
        commit_message_language: "en",
      };
      const mockAdapters = [
        { name: "Claude Code", command: "claude -p", available: true },
        { name: "LLM CLI", command: "llm", available: false },
      ];

      mockedInvoke
        .mockResolvedValueOnce(mockConfig)
        .mockResolvedValueOnce(mockAdapters);

      await useAiStore.getState().fetchConfig();
      await useAiStore.getState().detectAdapters();

      expect(useAiStore.getState().config).toEqual(mockConfig);
      expect(useAiStore.getState().adapters).toEqual(mockAdapters);
    });

    it("saves config with updated style while preserving language", async () => {
      const baseConfig = {
        commit_message_style: "conventional" as const,
        commit_message_language: "en" as const,
      };
      useAiStore.setState({ config: baseConfig });

      mockedInvoke.mockResolvedValueOnce(undefined);

      await useAiStore.getState().saveConfig({
        ...baseConfig,
        commit_message_style: "detailed",
      });

      expect(useAiStore.getState().config).toEqual({
        commit_message_style: "detailed",
        commit_message_language: "en",
      });
      expect(mockedInvoke).toHaveBeenCalledWith("save_ai_config", {
        aiConfig: {
          commit_message_style: "detailed",
          commit_message_language: "en",
        },
      });
    });

    it("saves config with updated language while preserving style", async () => {
      const baseConfig = {
        commit_message_style: "conventional" as const,
        commit_message_language: "en" as const,
      };
      useAiStore.setState({ config: baseConfig });

      mockedInvoke.mockResolvedValueOnce(undefined);

      await useAiStore.getState().saveConfig({
        ...baseConfig,
        commit_message_language: "ja",
      });

      expect(useAiStore.getState().config).toEqual({
        commit_message_style: "conventional",
        commit_message_language: "ja",
      });
      expect(mockedInvoke).toHaveBeenCalledWith("save_ai_config", {
        aiConfig: {
          commit_message_style: "conventional",
          commit_message_language: "ja",
        },
      });
    });

    it("does not update config in store when save fails", async () => {
      const initialConfig = {
        commit_message_style: "conventional" as const,
        commit_message_language: "en" as const,
      };
      useAiStore.setState({ config: initialConfig });

      mockedInvoke.mockRejectedValueOnce(new Error("save failed"));

      await expect(
        useAiStore.getState().saveConfig({
          ...initialConfig,
          commit_message_style: "detailed",
        }),
      ).rejects.toThrow("save failed");

      expect(useAiStore.getState().config).toEqual(initialConfig);
      expect(useAiStore.getState().error).toContain("save failed");
    });
  });
});
