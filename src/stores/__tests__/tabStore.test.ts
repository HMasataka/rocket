import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { useTabStore } from "../tabStore";

const mockedInvoke = vi.mocked(invoke);

describe("tabStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTabStore.setState({
      tabs: [],
      activeTabId: null,
    });
  });

  describe("openTab", () => {
    it("opens a tab and updates state", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      mockedInvoke.mockResolvedValueOnce([
        { id: "tab-1", name: "my-repo", path: "/home/user/my-repo" },
      ]);

      await useTabStore.getState().openTab("/home/user/my-repo");

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].name).toBe("my-repo");
      expect(state.activeTabId).toBeTruthy();
    });
  });

  describe("closeTab", () => {
    it("removes tab and updates active tab", async () => {
      useTabStore.setState({
        tabs: [
          { id: "tab-1", name: "repo1", path: "/path/repo1" },
          { id: "tab-2", name: "repo2", path: "/path/repo2" },
        ],
        activeTabId: "tab-1",
      });

      mockedInvoke.mockResolvedValueOnce(undefined);
      mockedInvoke.mockResolvedValueOnce([
        { id: "tab-2", name: "repo2", path: "/path/repo2" },
      ]);
      mockedInvoke.mockResolvedValueOnce("tab-2");

      await useTabStore.getState().closeTab("tab-1");

      const state = useTabStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].id).toBe("tab-2");
      expect(state.activeTabId).toBe("tab-2");
    });
  });

  describe("setActiveTab", () => {
    it("sets the active tab id", async () => {
      useTabStore.setState({
        tabs: [
          { id: "tab-1", name: "repo1", path: "/path/repo1" },
          { id: "tab-2", name: "repo2", path: "/path/repo2" },
        ],
        activeTabId: "tab-1",
      });

      mockedInvoke.mockResolvedValueOnce(undefined);

      await useTabStore.getState().setActiveTab("tab-2");

      expect(useTabStore.getState().activeTabId).toBe("tab-2");
    });
  });

  describe("reorderTabs", () => {
    it("reorders tabs from one index to another", () => {
      useTabStore.setState({
        tabs: [
          { id: "tab-1", name: "repo1", path: "/path/repo1" },
          { id: "tab-2", name: "repo2", path: "/path/repo2" },
          { id: "tab-3", name: "repo3", path: "/path/repo3" },
        ],
        activeTabId: "tab-1",
      });

      useTabStore.getState().reorderTabs(0, 2);

      const tabs = useTabStore.getState().tabs;
      expect(tabs[0].id).toBe("tab-2");
      expect(tabs[1].id).toBe("tab-3");
      expect(tabs[2].id).toBe("tab-1");
    });
  });

  describe("fetchTabs", () => {
    it("fetches tabs from backend", async () => {
      mockedInvoke.mockResolvedValueOnce([
        { id: "tab-1", name: "repo1", path: "/path/repo1" },
      ]);

      await useTabStore.getState().fetchTabs();

      expect(useTabStore.getState().tabs).toHaveLength(1);
      expect(mockedInvoke).toHaveBeenCalledWith("list_tabs");
    });
  });

  describe("fetchActiveTab", () => {
    it("fetches active tab id from backend", async () => {
      mockedInvoke.mockResolvedValueOnce("tab-1");

      await useTabStore.getState().fetchActiveTab();

      expect(useTabStore.getState().activeTabId).toBe("tab-1");
      expect(mockedInvoke).toHaveBeenCalledWith("get_active_tab");
    });

    it("handles null active tab", async () => {
      mockedInvoke.mockResolvedValueOnce(null);

      await useTabStore.getState().fetchActiveTab();

      expect(useTabStore.getState().activeTabId).toBeNull();
    });
  });
});
