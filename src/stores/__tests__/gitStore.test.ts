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
      branches: [],
      diff: [],
      remotes: [],
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

      const oid = await useGitStore.getState().commit("test message", false);

      expect(oid).toBe("abc123");
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("commit error"));

      await expect(
        useGitStore.getState().commit("test", false),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("commit error");
    });
  });

  describe("fetchBranches", () => {
    it("sets branches on success", async () => {
      const mockBranches = [
        { name: "main", is_head: true },
        { name: "feature", is_head: false },
      ];
      mockedInvoke.mockResolvedValueOnce(mockBranches);

      await useGitStore.getState().fetchBranches();

      expect(useGitStore.getState().branches).toEqual(mockBranches);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("list error"));

      await expect(useGitStore.getState().fetchBranches()).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("list error");
    });
  });

  describe("createBranch", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().createBranch("new-branch");

      expect(mockedInvoke).toHaveBeenCalledWith("create_branch", {
        name: "new-branch",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("create error"));

      await expect(
        useGitStore.getState().createBranch("bad"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("create error");
    });
  });

  describe("checkoutBranch", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().checkoutBranch("feature");

      expect(mockedInvoke).toHaveBeenCalledWith("checkout_branch", {
        name: "feature",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("checkout error"));

      await expect(
        useGitStore.getState().checkoutBranch("bad"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("checkout error");
    });
  });

  describe("deleteBranch", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().deleteBranch("old-branch");

      expect(mockedInvoke).toHaveBeenCalledWith("delete_branch", {
        name: "old-branch",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("delete error"));

      await expect(
        useGitStore.getState().deleteBranch("bad"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("delete error");
    });
  });

  describe("renameBranch", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().renameBranch("old", "new");

      expect(mockedInvoke).toHaveBeenCalledWith("rename_branch", {
        oldName: "old",
        newName: "new",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("rename error"));

      await expect(
        useGitStore.getState().renameBranch("old", "bad"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("rename error");
    });
  });

  describe("mergeBranch", () => {
    it("returns merge result on success", async () => {
      const mockResult = { kind: "fast_forward", oid: "abc123" };
      mockedInvoke.mockResolvedValueOnce(mockResult);

      const result = await useGitStore
        .getState()
        .mergeBranch("feature", "default");

      expect(result).toEqual(mockResult);
      expect(mockedInvoke).toHaveBeenCalledWith("merge_branch", {
        branchName: "feature",
        option: "default",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("merge error"));

      await expect(
        useGitStore.getState().mergeBranch("feature", "default"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("merge error");
    });
  });

  describe("fetchRemote", () => {
    it("returns fetch result on success", async () => {
      const mockResult = { remote_name: "origin" };
      mockedInvoke.mockResolvedValueOnce(mockResult);

      const result = await useGitStore.getState().fetchRemote("origin");

      expect(result).toEqual(mockResult);
      expect(mockedInvoke).toHaveBeenCalledWith("fetch_remote", {
        remoteName: "origin",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("fetch error"));

      await expect(
        useGitStore.getState().fetchRemote("origin"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("fetch error");
    });
  });

  describe("pullRemote", () => {
    it("returns merge result on success", async () => {
      const mockResult = { kind: "fast_forward", oid: "abc123" };
      mockedInvoke.mockResolvedValueOnce(mockResult);

      const result = await useGitStore.getState().pullRemote("origin", "merge");

      expect(result).toEqual(mockResult);
      expect(mockedInvoke).toHaveBeenCalledWith("pull_remote", {
        remoteName: "origin",
        option: "merge",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("pull error"));

      await expect(
        useGitStore.getState().pullRemote("origin", "merge"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("pull error");
    });
  });

  describe("pushRemote", () => {
    it("returns push result on success", async () => {
      const mockResult = { remote_name: "origin", branch: "main" };
      mockedInvoke.mockResolvedValueOnce(mockResult);

      const result = await useGitStore.getState().pushRemote("origin");

      expect(result).toEqual(mockResult);
      expect(mockedInvoke).toHaveBeenCalledWith("push_remote", {
        remoteName: "origin",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("push error"));

      await expect(
        useGitStore.getState().pushRemote("origin"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("push error");
    });
  });

  describe("fetchRemotes", () => {
    it("sets remotes on success", async () => {
      const mockRemotes = [
        { name: "origin", url: "https://example.com/repo.git" },
      ];
      mockedInvoke.mockResolvedValueOnce(mockRemotes);

      await useGitStore.getState().fetchRemotes();

      expect(useGitStore.getState().remotes).toEqual(mockRemotes);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("remotes error"));

      await expect(useGitStore.getState().fetchRemotes()).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("remotes error");
    });
  });

  describe("addRemote", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().addRemote("upstream", "https://example.com");

      expect(mockedInvoke).toHaveBeenCalledWith("add_remote", {
        name: "upstream",
        url: "https://example.com",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("add error"));

      await expect(
        useGitStore.getState().addRemote("bad", "url"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("add error");
    });
  });

  describe("removeRemote", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().removeRemote("origin");

      expect(mockedInvoke).toHaveBeenCalledWith("remove_remote", {
        name: "origin",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("remove error"));

      await expect(
        useGitStore.getState().removeRemote("bad"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("remove error");
    });
  });

  describe("editRemote", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().editRemote("origin", "https://new-url.com");

      expect(mockedInvoke).toHaveBeenCalledWith("edit_remote", {
        name: "origin",
        newUrl: "https://new-url.com",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("edit error"));

      await expect(
        useGitStore.getState().editRemote("bad", "url"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("edit error");
    });
  });

  describe("stageHunk", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      const hunk = {
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 3,
      };

      await useGitStore.getState().stageHunk("file.txt", hunk);

      expect(mockedInvoke).toHaveBeenCalledWith("stage_hunk", {
        path: "file.txt",
        hunk,
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("stage hunk error"));
      const hunk = {
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 3,
      };

      await expect(
        useGitStore.getState().stageHunk("file.txt", hunk),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("stage hunk error");
    });
  });

  describe("unstageHunk", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      const hunk = {
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 3,
      };

      await useGitStore.getState().unstageHunk("file.txt", hunk);

      expect(mockedInvoke).toHaveBeenCalledWith("unstage_hunk", {
        path: "file.txt",
        hunk,
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("unstage hunk error"));
      const hunk = {
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 3,
      };

      await expect(
        useGitStore.getState().unstageHunk("file.txt", hunk),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("unstage hunk error");
    });
  });

  describe("discardHunk", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      const hunk = {
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 3,
      };

      await useGitStore.getState().discardHunk("file.txt", hunk);

      expect(mockedInvoke).toHaveBeenCalledWith("discard_hunk", {
        path: "file.txt",
        hunk,
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("discard hunk error"));
      const hunk = {
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 3,
      };

      await expect(
        useGitStore.getState().discardHunk("file.txt", hunk),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("discard hunk error");
    });
  });

  describe("stageLines", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      const lineRange = {
        hunk: { old_start: 1, old_lines: 3, new_start: 1, new_lines: 3 },
        line_indices: [1, 2],
      };

      await useGitStore.getState().stageLines("file.txt", lineRange);

      expect(mockedInvoke).toHaveBeenCalledWith("stage_lines", {
        path: "file.txt",
        lineRange,
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("stage lines error"));
      const lineRange = {
        hunk: { old_start: 1, old_lines: 3, new_start: 1, new_lines: 3 },
        line_indices: [1],
      };

      await expect(
        useGitStore.getState().stageLines("file.txt", lineRange),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("stage lines error");
    });
  });

  describe("unstageLines", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      const lineRange = {
        hunk: { old_start: 1, old_lines: 3, new_start: 1, new_lines: 3 },
        line_indices: [1, 2],
      };

      await useGitStore.getState().unstageLines("file.txt", lineRange);

      expect(mockedInvoke).toHaveBeenCalledWith("unstage_lines", {
        path: "file.txt",
        lineRange,
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("unstage lines error"));
      const lineRange = {
        hunk: { old_start: 1, old_lines: 3, new_start: 1, new_lines: 3 },
        line_indices: [1],
      };

      await expect(
        useGitStore.getState().unstageLines("file.txt", lineRange),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("unstage lines error");
    });
  });

  describe("discardLines", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      const lineRange = {
        hunk: { old_start: 1, old_lines: 3, new_start: 1, new_lines: 3 },
        line_indices: [1, 2],
      };

      await useGitStore.getState().discardLines("file.txt", lineRange);

      expect(mockedInvoke).toHaveBeenCalledWith("discard_lines", {
        path: "file.txt",
        lineRange,
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("discard lines error"));
      const lineRange = {
        hunk: { old_start: 1, old_lines: 3, new_start: 1, new_lines: 3 },
        line_indices: [1],
      };

      await expect(
        useGitStore.getState().discardLines("file.txt", lineRange),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("discard lines error");
    });
  });

  describe("getHeadCommitMessage", () => {
    it("returns message on success", async () => {
      mockedInvoke.mockResolvedValueOnce("commit message");

      const message = await useGitStore.getState().getHeadCommitMessage();

      expect(message).toBe("commit message");
      expect(mockedInvoke).toHaveBeenCalledWith("get_head_commit_message");
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("message error"));

      await expect(
        useGitStore.getState().getHeadCommitMessage(),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("message error");
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
