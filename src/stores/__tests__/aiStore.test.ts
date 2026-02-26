import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { useAiStore } from "../aiStore";

const mockedInvoke = vi.mocked(invoke);

describe("aiStore", () => {
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

  describe("detectAdapters", () => {
    it("sets adapters on success", async () => {
      const mockAdapters = [
        { name: "Claude Code", command: "claude", available: true },
        { name: "LLM CLI", command: "llm", available: false },
      ];
      mockedInvoke.mockResolvedValueOnce(mockAdapters);

      await useAiStore.getState().detectAdapters();

      expect(useAiStore.getState().adapters).toEqual(mockAdapters);
      expect(mockedInvoke).toHaveBeenCalledWith("detect_cli_adapters");
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("detect error"));

      await expect(useAiStore.getState().detectAdapters()).rejects.toThrow();

      expect(useAiStore.getState().error).toContain("detect error");
    });
  });

  describe("generateCommitMessage", () => {
    it("sets lastResult and generating flag on success", async () => {
      const mockResult = {
        subject: "feat: add auth",
        body: "Added auth handler",
        alternatives: ["fix: auth handler"],
      };
      mockedInvoke.mockResolvedValueOnce(mockResult);

      const result = await useAiStore
        .getState()
        .generateCommitMessage("conventional", "en");

      expect(result).toEqual(mockResult);
      expect(useAiStore.getState().lastResult).toEqual(mockResult);
      expect(useAiStore.getState().generating).toBe(false);
      expect(mockedInvoke).toHaveBeenCalledWith("generate_commit_message", {
        format: "conventional",
        language: "en",
      });
    });

    it("sets generating to true during request", async () => {
      let capturedGenerating = false;
      mockedInvoke.mockImplementationOnce(() => {
        capturedGenerating = useAiStore.getState().generating;
        return Promise.resolve({
          subject: "test",
          body: "",
          alternatives: [],
        });
      });

      await useAiStore.getState().generateCommitMessage("simple", "en");

      expect(capturedGenerating).toBe(true);
      expect(useAiStore.getState().generating).toBe(false);
    });

    it("sets error and resets generating on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("generate error"));

      await expect(
        useAiStore.getState().generateCommitMessage("conventional", "en"),
      ).rejects.toThrow();

      expect(useAiStore.getState().error).toContain("generate error");
      expect(useAiStore.getState().generating).toBe(false);
    });
  });

  describe("fetchConfig", () => {
    it("sets config on success", async () => {
      const mockConfig = {
        commit_message_style: "conventional",
        commit_message_language: "en",
        provider_priority: [],
      };
      mockedInvoke.mockResolvedValueOnce(mockConfig);

      await useAiStore.getState().fetchConfig();

      expect(useAiStore.getState().config).toEqual(mockConfig);
      expect(mockedInvoke).toHaveBeenCalledWith("get_ai_config");
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("config error"));

      await expect(useAiStore.getState().fetchConfig()).rejects.toThrow();

      expect(useAiStore.getState().error).toContain("config error");
    });
  });

  describe("saveConfig", () => {
    it("updates config on success", async () => {
      const mockConfig = {
        commit_message_style: "detailed" as const,
        commit_message_language: "ja" as const,
        provider_priority: ["Claude Code"],
      };
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useAiStore.getState().saveConfig(mockConfig);

      expect(useAiStore.getState().config).toEqual(mockConfig);
      expect(mockedInvoke).toHaveBeenCalledWith("save_ai_config", {
        aiConfig: mockConfig,
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("save error"));

      await expect(
        useAiStore.getState().saveConfig({
          commit_message_style: "conventional",
          commit_message_language: "en",
          provider_priority: [],
        }),
      ).rejects.toThrow();

      expect(useAiStore.getState().error).toContain("save error");
    });
  });

  describe("clearResult", () => {
    it("clears lastResult", () => {
      useAiStore.setState({
        lastResult: {
          subject: "test",
          body: "",
          alternatives: [],
        },
      });

      useAiStore.getState().clearResult();

      expect(useAiStore.getState().lastResult).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears error", () => {
      useAiStore.setState({ error: "some error" });

      useAiStore.getState().clearError();

      expect(useAiStore.getState().error).toBeNull();
    });
  });
});
