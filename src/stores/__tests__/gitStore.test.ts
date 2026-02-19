import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { useGitStore } from "../gitStore";

const mockedInvoke = vi.mocked(invoke);

describe("gitStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGitStore.setState({
      status: null,
      currentBranch: null,
      diff: [],
      loading: false,
      error: null,
    });
  });

  describe("fetchStatus", () => {
    it("sets status on success", async () => {
      const mockStatus = {
        files: [{ path: "a.txt", kind: "modified", staging: "unstaged" }],
      };
      mockedInvoke.mockResolvedValueOnce(mockStatus);

      await useGitStore.getState().fetchStatus();

      const state = useGitStore.getState();
      expect(state.status).toEqual(mockStatus);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("status error"));

      await expect(useGitStore.getState().fetchStatus()).rejects.toThrow();

      const state = useGitStore.getState();
      expect(state.error).toContain("status error");
      expect(state.loading).toBe(false);
    });
  });

  describe("fetchBranch", () => {
    it("sets currentBranch on success", async () => {
      mockedInvoke.mockResolvedValueOnce("main");

      await useGitStore.getState().fetchBranch();

      expect(useGitStore.getState().currentBranch).toBe("main");
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("branch error"));

      await expect(useGitStore.getState().fetchBranch()).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("branch error");
    });
  });

  describe("fetchDiff", () => {
    it("sets diff on success", async () => {
      const mockDiff = [{ old_path: "a.txt", new_path: "a.txt", hunks: [] }];
      mockedInvoke.mockResolvedValueOnce(mockDiff);

      await useGitStore.getState().fetchDiff("a.txt", false);

      expect(useGitStore.getState().diff).toEqual(mockDiff);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("diff error"));

      await expect(
        useGitStore.getState().fetchDiff("a.txt", false),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("diff error");
    });
  });

  describe("commit", () => {
    it("returns oid on success", async () => {
      mockedInvoke.mockResolvedValueOnce({ oid: "abc123" });

      const oid = await useGitStore.getState().commit("test message");

      expect(oid).toBe("abc123");
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("commit error"));

      await expect(useGitStore.getState().commit("test")).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("commit error");
    });
  });

  describe("clearError", () => {
    it("clears the error state", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("some error"));
      await expect(useGitStore.getState().fetchBranch()).rejects.toThrow();

      expect(useGitStore.getState().error).not.toBeNull();

      useGitStore.getState().clearError();
      expect(useGitStore.getState().error).toBeNull();
    });
  });
});
