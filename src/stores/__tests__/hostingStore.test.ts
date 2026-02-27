import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { useHostingStore } from "../hostingStore";

const mockedInvoke = vi.mocked(invoke);

describe("hostingStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useHostingStore.setState({
      hostingInfo: null,
      defaultBranch: null,
      pullRequests: [],
      issues: [],
      selectedPrDetail: null,
      selectedPrNumber: null,
      activeTab: "pulls",
      loading: false,
      error: null,
    });
  });

  describe("fetchHostingInfo", () => {
    it("sets hostingInfo on success", async () => {
      const mockInfo = {
        provider: "github",
        owner: "octocat",
        repo: "hello-world",
        url: "https://github.com/octocat/hello-world",
      };
      mockedInvoke.mockResolvedValueOnce(mockInfo);

      await useHostingStore.getState().fetchHostingInfo();

      const state = useHostingStore.getState();
      expect(state.hostingInfo).toEqual(mockInfo);
      expect(state.loading).toBe(false);
    });

    it("sets loading to true during fetch", async () => {
      let resolveFn: ((v: unknown) => void) | undefined;
      const promise = new Promise((resolve) => {
        resolveFn = resolve;
      });
      mockedInvoke.mockReturnValueOnce(promise);

      const fetchPromise = useHostingStore.getState().fetchHostingInfo();
      expect(useHostingStore.getState().loading).toBe(true);

      resolveFn?.({
        provider: "github",
        owner: "octocat",
        repo: "hello-world",
        url: "https://github.com/octocat/hello-world",
      });
      await fetchPromise;
      expect(useHostingStore.getState().loading).toBe(false);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("hosting error"));

      await expect(
        useHostingStore.getState().fetchHostingInfo(),
      ).rejects.toThrow();

      const state = useHostingStore.getState();
      expect(state.error).toContain("hosting error");
      expect(state.loading).toBe(false);
    });
  });

  describe("fetchDefaultBranch", () => {
    it("sets defaultBranch on success", async () => {
      mockedInvoke.mockResolvedValueOnce("main");

      await useHostingStore.getState().fetchDefaultBranch();

      expect(useHostingStore.getState().defaultBranch).toBe("main");
    });

    it("sets defaultBranch to null on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("gh not available"));

      await useHostingStore.getState().fetchDefaultBranch();

      expect(useHostingStore.getState().defaultBranch).toBeNull();
    });
  });

  describe("fetchPullRequests", () => {
    it("sets pullRequests on success", async () => {
      const mockPrs = [
        {
          number: 42,
          title: "Add auth",
          state: "open",
          author: "yamada",
          head_branch: "feature/auth",
          base_branch: "main",
          draft: false,
          created_at: "2025-01-01",
          updated_at: "2025-01-02",
          labels: [],
          additions: 100,
          deletions: 20,
          changed_files: 5,
          body: "",
          url: "https://github.com/owner/repo/pull/42",
        },
      ];
      mockedInvoke.mockResolvedValueOnce(mockPrs);

      await useHostingStore.getState().fetchPullRequests();

      const state = useHostingStore.getState();
      expect(state.pullRequests).toEqual(mockPrs);
      expect(state.loading).toBe(false);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("pr list error"));

      await expect(
        useHostingStore.getState().fetchPullRequests(),
      ).rejects.toThrow();

      const state = useHostingStore.getState();
      expect(state.error).toContain("pr list error");
      expect(state.loading).toBe(false);
    });
  });

  describe("fetchIssues", () => {
    it("sets issues on success", async () => {
      const mockIssues = [
        {
          number: 18,
          title: "Fix login",
          state: "open",
          author: "tanaka",
          labels: [],
          created_at: "2025-01-01",
          url: "https://github.com/owner/repo/issues/18",
        },
      ];
      mockedInvoke.mockResolvedValueOnce(mockIssues);

      await useHostingStore.getState().fetchIssues();

      const state = useHostingStore.getState();
      expect(state.issues).toEqual(mockIssues);
      expect(state.loading).toBe(false);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("issue list error"));

      await expect(useHostingStore.getState().fetchIssues()).rejects.toThrow();

      const state = useHostingStore.getState();
      expect(state.error).toContain("issue list error");
      expect(state.loading).toBe(false);
    });
  });

  describe("selectPr", () => {
    it("sets selectedPrNumber and selectedPrDetail on success", async () => {
      const mockDetail = {
        pull_request: {
          number: 42,
          title: "Add auth",
          state: "open",
          author: "yamada",
          head_branch: "feature/auth",
          base_branch: "main",
          draft: false,
          created_at: "2025-01-01",
          updated_at: "2025-01-02",
          labels: [],
          additions: 100,
          deletions: 20,
          changed_files: 5,
          body: "description",
          url: "https://github.com/owner/repo/pull/42",
        },
        checks: [],
        reviewers: [],
      };
      mockedInvoke.mockResolvedValueOnce(mockDetail);

      await useHostingStore.getState().selectPr(42);

      const state = useHostingStore.getState();
      expect(state.selectedPrNumber).toBe(42);
      expect(state.selectedPrDetail).toEqual(mockDetail);
      expect(state.loading).toBe(false);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("detail error"));

      await expect(useHostingStore.getState().selectPr(42)).rejects.toThrow();

      const state = useHostingStore.getState();
      expect(state.error).toContain("detail error");
      expect(state.loading).toBe(false);
    });
  });

  describe("setActiveTab", () => {
    it("switches to issues tab", () => {
      useHostingStore.getState().setActiveTab("issues");

      expect(useHostingStore.getState().activeTab).toBe("issues");
    });

    it("switches back to pulls tab", () => {
      useHostingStore.getState().setActiveTab("issues");
      useHostingStore.getState().setActiveTab("pulls");

      expect(useHostingStore.getState().activeTab).toBe("pulls");
    });
  });

  describe("clearError", () => {
    it("clears the error state", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("some error"));
      await expect(
        useHostingStore.getState().fetchHostingInfo(),
      ).rejects.toThrow();

      expect(useHostingStore.getState().error).not.toBeNull();

      useHostingStore.getState().clearError();
      expect(useHostingStore.getState().error).toBeNull();
    });
  });
});
