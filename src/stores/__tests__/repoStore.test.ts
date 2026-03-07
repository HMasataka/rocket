import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { useRepoStore } from "../repoStore";

const mockedInvoke = vi.mocked(invoke);

describe("repoStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRepoStore.setState({
      recentRepos: [],
      loading: false,
      error: null,
    });
  });

  describe("fetchRecentRepos", () => {
    it("sets recentRepos on success", async () => {
      const mockRepos = [
        {
          path: "/home/user/project",
          name: "project",
          last_opened: "2026-01-01",
        },
      ];
      mockedInvoke.mockResolvedValueOnce(mockRepos);

      await useRepoStore.getState().fetchRecentRepos();

      expect(useRepoStore.getState().recentRepos).toEqual(mockRepos);
      expect(mockedInvoke).toHaveBeenCalledWith("get_recent_repos");
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("fetch repos error"));

      await expect(
        useRepoStore.getState().fetchRecentRepos(),
      ).rejects.toThrow();

      expect(useRepoStore.getState().error).toContain("fetch repos error");
    });
  });

  describe("openRepository", () => {
    it("sets loading during operation", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useRepoStore.getState().openRepository("/home/user/project");

      expect(useRepoStore.getState().loading).toBe(false);
      expect(useRepoStore.getState().error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith("open_repository", {
        path: "/home/user/project",
        tabId: "default",
      });
    });

    it("sets error and resets loading on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("open error"));

      await expect(
        useRepoStore.getState().openRepository("/bad/path"),
      ).rejects.toThrow();

      const state = useRepoStore.getState();
      expect(state.error).toContain("open error");
      expect(state.loading).toBe(false);
    });
  });

  describe("initRepository", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useRepoStore.getState().initRepository("/home/user/new-repo");

      expect(useRepoStore.getState().loading).toBe(false);
      expect(mockedInvoke).toHaveBeenCalledWith("init_repository", {
        path: "/home/user/new-repo",
        gitignoreTemplate: null,
        tabId: "default",
      });
    });

    it("passes gitignore template", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useRepoStore
        .getState()
        .initRepository("/home/user/new-repo", "Node");

      expect(mockedInvoke).toHaveBeenCalledWith("init_repository", {
        path: "/home/user/new-repo",
        gitignoreTemplate: "Node",
        tabId: "default",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("init error"));

      await expect(
        useRepoStore.getState().initRepository("/bad/path"),
      ).rejects.toThrow();

      const state = useRepoStore.getState();
      expect(state.error).toContain("init error");
      expect(state.loading).toBe(false);
    });
  });

  describe("cloneRepository", () => {
    it("calls invoke on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useRepoStore
        .getState()
        .cloneRepository("https://example.com/repo.git", "/home/user/repo");

      expect(useRepoStore.getState().loading).toBe(false);
      expect(mockedInvoke).toHaveBeenCalledWith("clone_repository", {
        url: "https://example.com/repo.git",
        path: "/home/user/repo",
        tabId: "default",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("clone error"));

      await expect(
        useRepoStore.getState().cloneRepository("bad-url", "/path"),
      ).rejects.toThrow();

      const state = useRepoStore.getState();
      expect(state.error).toContain("clone error");
      expect(state.loading).toBe(false);
    });
  });

  describe("removeRecentRepo", () => {
    it("removes repo from list on success", async () => {
      useRepoStore.setState({
        recentRepos: [
          { path: "/home/user/a", name: "a", last_opened: "2026-01-01" },
          { path: "/home/user/b", name: "b", last_opened: "2026-01-02" },
        ],
      });
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useRepoStore.getState().removeRecentRepo("/home/user/a");

      expect(useRepoStore.getState().recentRepos).toEqual([
        { path: "/home/user/b", name: "b", last_opened: "2026-01-02" },
      ]);
      expect(mockedInvoke).toHaveBeenCalledWith("remove_recent_repo", {
        path: "/home/user/a",
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("remove error"));

      await expect(
        useRepoStore.getState().removeRecentRepo("/bad/path"),
      ).rejects.toThrow();

      expect(useRepoStore.getState().error).toContain("remove error");
    });
  });
});
