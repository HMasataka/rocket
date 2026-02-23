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
      stashes: [],
      tags: [],
      merging: false,
      conflictFiles: [],
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

  describe("fetchStashes", () => {
    it("sets stashes on success", async () => {
      const mockStashes = [
        {
          index: 0,
          message: "WIP on main",
          branch_name: "main",
          author_date: 1700000000,
        },
      ];
      mockedInvoke.mockResolvedValueOnce(mockStashes);

      await useGitStore.getState().fetchStashes();

      expect(useGitStore.getState().stashes).toEqual(mockStashes);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("stash error"));

      await expect(useGitStore.getState().fetchStashes()).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("stash error");
    });
  });

  describe("stashSave", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().stashSave("test message");

      expect(mockedInvoke).toHaveBeenCalledWith("stash_save", {
        message: "test message",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("save error"));

      await expect(useGitStore.getState().stashSave("msg")).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("save error");
    });
  });

  describe("applyStash", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().applyStash(0);

      expect(mockedInvoke).toHaveBeenCalledWith("apply_stash", { index: 0 });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("apply error"));

      await expect(useGitStore.getState().applyStash(0)).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("apply error");
    });
  });

  describe("popStash", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().popStash(0);

      expect(mockedInvoke).toHaveBeenCalledWith("pop_stash", { index: 0 });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("pop error"));

      await expect(useGitStore.getState().popStash(0)).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("pop error");
    });
  });

  describe("dropStash", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().dropStash(0);

      expect(mockedInvoke).toHaveBeenCalledWith("drop_stash", { index: 0 });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("drop error"));

      await expect(useGitStore.getState().dropStash(0)).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("drop error");
    });
  });

  describe("fetchTags", () => {
    it("sets tags on success", async () => {
      const mockTags = [
        {
          name: "v1.0.0",
          target_oid: "abc123",
          target_short_oid: "abc123",
          is_annotated: false,
          tagger_name: null,
          tagger_date: null,
          message: null,
        },
      ];
      mockedInvoke.mockResolvedValueOnce(mockTags);

      await useGitStore.getState().fetchTags();

      expect(useGitStore.getState().tags).toEqual(mockTags);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("tag error"));

      await expect(useGitStore.getState().fetchTags()).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("tag error");
    });
  });

  describe("createTag", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().createTag("v1.0.0", "Release 1.0");

      expect(mockedInvoke).toHaveBeenCalledWith("create_tag", {
        name: "v1.0.0",
        message: "Release 1.0",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("create tag error"));

      await expect(
        useGitStore.getState().createTag("bad", null),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("create tag error");
    });
  });

  describe("deleteTag", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().deleteTag("v1.0.0");

      expect(mockedInvoke).toHaveBeenCalledWith("delete_tag", {
        name: "v1.0.0",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("delete tag error"));

      await expect(useGitStore.getState().deleteTag("bad")).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("delete tag error");
    });
  });

  describe("checkoutTag", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().checkoutTag("v1.0.0");

      expect(mockedInvoke).toHaveBeenCalledWith("checkout_tag", {
        name: "v1.0.0",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("checkout tag error"));

      await expect(useGitStore.getState().checkoutTag("bad")).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("checkout tag error");
    });
  });

  describe("fetchMergeState", () => {
    it("sets merging on success", async () => {
      mockedInvoke.mockResolvedValueOnce(true);

      await useGitStore.getState().fetchMergeState();

      expect(mockedInvoke).toHaveBeenCalledWith("is_merging");
      expect(useGitStore.getState().merging).toBe(true);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("merge state error"));

      await expect(useGitStore.getState().fetchMergeState()).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("merge state error");
    });
  });

  describe("fetchConflictFiles", () => {
    it("sets conflictFiles on success", async () => {
      const mockFiles = [
        { path: "file.txt", conflict_count: 1, conflicts: [] },
      ];
      mockedInvoke.mockResolvedValueOnce(mockFiles);

      await useGitStore.getState().fetchConflictFiles();

      expect(mockedInvoke).toHaveBeenCalledWith("get_conflict_files");
      expect(useGitStore.getState().conflictFiles).toEqual(mockFiles);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("conflict files error"));

      await expect(
        useGitStore.getState().fetchConflictFiles(),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("conflict files error");
    });
  });

  describe("resolveConflict", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().resolveConflict("file.txt", "ours");

      expect(mockedInvoke).toHaveBeenCalledWith("resolve_conflict", {
        path: "file.txt",
        resolution: "ours",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("resolve error"));

      await expect(
        useGitStore.getState().resolveConflict("file.txt", "ours"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("resolve error");
    });
  });

  describe("resolveConflictBlock", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().resolveConflictBlock("file.txt", 0, "ours");

      expect(mockedInvoke).toHaveBeenCalledWith("resolve_conflict_block", {
        path: "file.txt",
        blockIndex: 0,
        resolution: "ours",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("block resolve error"));

      await expect(
        useGitStore.getState().resolveConflictBlock("file.txt", 0, "ours"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("block resolve error");
    });
  });

  describe("markResolved", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().markResolved("file.txt");

      expect(mockedInvoke).toHaveBeenCalledWith("mark_resolved", {
        path: "file.txt",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("mark resolved error"));

      await expect(
        useGitStore.getState().markResolved("file.txt"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("mark resolved error");
    });
  });

  describe("abortMerge", () => {
    it("resets merging state on success", async () => {
      useGitStore.setState({ merging: true });
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useGitStore.getState().abortMerge();

      expect(mockedInvoke).toHaveBeenCalledWith("abort_merge");
      expect(useGitStore.getState().merging).toBe(false);
      expect(useGitStore.getState().conflictFiles).toEqual([]);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("abort error"));

      await expect(useGitStore.getState().abortMerge()).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("abort error");
    });
  });

  describe("continueMerge", () => {
    it("resets merging state on success", async () => {
      useGitStore.setState({ merging: true });
      mockedInvoke.mockResolvedValueOnce({ oid: "abc123" });

      const oid = await useGitStore.getState().continueMerge("msg");

      expect(mockedInvoke).toHaveBeenCalledWith("continue_merge", {
        message: "msg",
      });
      expect(oid).toBe("abc123");
      expect(useGitStore.getState().merging).toBe(false);
      expect(useGitStore.getState().conflictFiles).toEqual([]);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("continue error"));

      await expect(
        useGitStore.getState().continueMerge("msg"),
      ).rejects.toThrow();

      expect(useGitStore.getState().error).toContain("continue error");
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
