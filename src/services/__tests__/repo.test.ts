import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import {
  cloneRepository,
  getRecentRepos,
  initRepository,
  openRepository,
  removeRecentRepo,
} from "../repo";

const mockedInvoke = vi.mocked(invoke);

describe("repo service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("openRepository", () => {
    it("invokes with path", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await openRepository("/home/user/project");

      expect(mockedInvoke).toHaveBeenCalledWith("open_repository", {
        path: "/home/user/project",
      });
    });
  });

  describe("initRepository", () => {
    it("invokes with path and null template", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await initRepository("/home/user/new-repo");

      expect(mockedInvoke).toHaveBeenCalledWith("init_repository", {
        path: "/home/user/new-repo",
        gitignoreTemplate: null,
      });
    });

    it("invokes with path and template name", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await initRepository("/home/user/new-repo", "Rust");

      expect(mockedInvoke).toHaveBeenCalledWith("init_repository", {
        path: "/home/user/new-repo",
        gitignoreTemplate: "Rust",
      });
    });
  });

  describe("cloneRepository", () => {
    it("invokes with url and path", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await cloneRepository("https://example.com/repo.git", "/home/user/repo");

      expect(mockedInvoke).toHaveBeenCalledWith("clone_repository", {
        url: "https://example.com/repo.git",
        path: "/home/user/repo",
      });
    });
  });

  describe("getRecentRepos", () => {
    it("returns recent repos list", async () => {
      const mockRepos = [
        {
          path: "/home/user/project",
          name: "project",
          last_opened: "2026-01-01",
        },
      ];
      mockedInvoke.mockResolvedValueOnce(mockRepos);

      const result = await getRecentRepos();

      expect(mockedInvoke).toHaveBeenCalledWith("get_recent_repos");
      expect(result).toEqual(mockRepos);
    });
  });

  describe("removeRecentRepo", () => {
    it("invokes with path", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await removeRecentRepo("/home/user/project");

      expect(mockedInvoke).toHaveBeenCalledWith("remove_recent_repo", {
        path: "/home/user/project",
      });
    });
  });
});
