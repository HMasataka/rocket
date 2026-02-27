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
      reviewComments: [],
      reviewing: false,
      resolving: false,
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
        prefer_local_llm: false,
        exclude_patterns: [],
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
        prefer_local_llm: false,
        exclude_patterns: [] as string[],
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
          prefer_local_llm: false,
          exclude_patterns: [],
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

  describe("reviewDiff", () => {
    it("sets reviewComments on success", async () => {
      const mockResult = {
        comments: [
          {
            file: "src/main.rs",
            line_start: 10,
            line_end: 12,
            type: "warning" as const,
            message: "Unused variable",
          },
        ],
      };
      mockedInvoke.mockResolvedValueOnce(mockResult);

      const result = await useAiStore.getState().reviewDiff();

      expect(result).toEqual(mockResult);
      expect(useAiStore.getState().reviewComments).toEqual(mockResult.comments);
      expect(useAiStore.getState().reviewing).toBe(false);
      expect(mockedInvoke).toHaveBeenCalledWith("review_diff");
    });

    it("sets reviewing to true during request", async () => {
      let capturedReviewing = false;
      mockedInvoke.mockImplementationOnce(() => {
        capturedReviewing = useAiStore.getState().reviewing;
        return Promise.resolve({ comments: [] });
      });

      await useAiStore.getState().reviewDiff();

      expect(capturedReviewing).toBe(true);
      expect(useAiStore.getState().reviewing).toBe(false);
    });

    it("sets error and resets reviewing on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("review error"));

      await expect(useAiStore.getState().reviewDiff()).rejects.toThrow();

      expect(useAiStore.getState().error).toContain("review error");
      expect(useAiStore.getState().reviewing).toBe(false);
    });
  });

  describe("resolveConflict", () => {
    it("returns suggestion on success", async () => {
      const mockSuggestion = {
        resolved_code: "merged code",
        confidence: "high" as const,
        reason: "Compatible changes",
      };
      mockedInvoke.mockResolvedValueOnce(mockSuggestion);

      const result = await useAiStore
        .getState()
        .resolveConflict("ours", "theirs", null);

      expect(result).toEqual(mockSuggestion);
      expect(useAiStore.getState().resolving).toBe(false);
      expect(mockedInvoke).toHaveBeenCalledWith("ai_resolve_conflict", {
        ours: "ours",
        theirs: "theirs",
        base: null,
      });
    });

    it("sets resolving to true during request", async () => {
      let capturedResolving = false;
      mockedInvoke.mockImplementationOnce(() => {
        capturedResolving = useAiStore.getState().resolving;
        return Promise.resolve({
          resolved_code: "code",
          confidence: "high",
          reason: "ok",
        });
      });

      await useAiStore.getState().resolveConflict("a", "b", null);

      expect(capturedResolving).toBe(true);
      expect(useAiStore.getState().resolving).toBe(false);
    });

    it("sets error and resets resolving on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("resolve error"));

      await expect(
        useAiStore.getState().resolveConflict("a", "b", null),
      ).rejects.toThrow();

      expect(useAiStore.getState().error).toContain("resolve error");
      expect(useAiStore.getState().resolving).toBe(false);
    });
  });

  describe("dismissReviewComment", () => {
    it("removes the specified comment by identity", () => {
      const comments = [
        {
          file: "a.rs",
          line_start: 1,
          line_end: 2,
          type: "warning" as const,
          message: "msg1",
        },
        {
          file: "b.rs",
          line_start: 5,
          line_end: 5,
          type: "error" as const,
          message: "msg2",
        },
        {
          file: "a.rs",
          line_start: 10,
          line_end: 12,
          type: "info" as const,
          message: "msg3",
        },
      ];
      useAiStore.setState({ reviewComments: comments });

      useAiStore.getState().dismissReviewComment(comments[1]);

      const remaining = useAiStore.getState().reviewComments;
      expect(remaining).toHaveLength(2);
      expect(remaining[0].message).toBe("msg1");
      expect(remaining[1].message).toBe("msg3");
    });

    it("does not remove other comments with different identity", () => {
      const comments = [
        {
          file: "a.rs",
          line_start: 1,
          line_end: 2,
          type: "warning" as const,
          message: "msg1",
        },
      ];
      useAiStore.setState({ reviewComments: comments });

      useAiStore.getState().dismissReviewComment({
        file: "a.rs",
        line_start: 1,
        line_end: 2,
        type: "warning",
        message: "different message",
      });

      expect(useAiStore.getState().reviewComments).toHaveLength(1);
    });
  });

  describe("clearReviewComments", () => {
    it("clears all review comments", () => {
      useAiStore.setState({
        reviewComments: [
          {
            file: "a.rs",
            line_start: 1,
            line_end: 2,
            type: "warning" as const,
            message: "msg",
          },
        ],
      });

      useAiStore.getState().clearReviewComments();

      expect(useAiStore.getState().reviewComments).toEqual([]);
    });
  });
});
