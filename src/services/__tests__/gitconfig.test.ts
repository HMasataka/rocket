import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import {
  getGitconfigEntries,
  getGitconfigPath,
  getGitconfigValue,
  setGitconfigValue,
  unsetGitconfigValue,
} from "../gitconfig";

const mockedInvoke = vi.mocked(invoke);

describe("gitconfig service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGitconfigEntries", () => {
    it("invokes with correct scope", async () => {
      const mockEntries = [
        { key: "user.name", value: "Test" },
        { key: "user.email", value: "test@example.com" },
      ];
      mockedInvoke.mockResolvedValueOnce(mockEntries);

      const result = await getGitconfigEntries("tab-1", "local");

      expect(mockedInvoke).toHaveBeenCalledWith("get_gitconfig_entries", {
        tabId: "tab-1",
        scope: "local",
      });
      expect(result).toEqual(mockEntries);
    });
  });

  describe("getGitconfigValue", () => {
    it("invokes with scope and key", async () => {
      mockedInvoke.mockResolvedValueOnce("Test User");

      const result = await getGitconfigValue("tab-1", "global", "user.name");

      expect(mockedInvoke).toHaveBeenCalledWith("get_gitconfig_value", {
        tabId: "tab-1",
        scope: "global",
        key: "user.name",
      });
      expect(result).toBe("Test User");
    });

    it("returns null for missing key", async () => {
      mockedInvoke.mockResolvedValueOnce(null);

      const result = await getGitconfigValue(
        "tab-1",
        "local",
        "nonexistent.key",
      );

      expect(result).toBeNull();
    });
  });

  describe("setGitconfigValue", () => {
    it("invokes with scope, key, and value", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await setGitconfigValue("tab-1", "local", "user.name", "New Name");

      expect(mockedInvoke).toHaveBeenCalledWith("set_gitconfig_value", {
        tabId: "tab-1",
        scope: "local",
        key: "user.name",
        value: "New Name",
      });
    });
  });

  describe("unsetGitconfigValue", () => {
    it("invokes with scope and key", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await unsetGitconfigValue("tab-1", "global", "user.signingKey");

      expect(mockedInvoke).toHaveBeenCalledWith("unset_gitconfig_value", {
        tabId: "tab-1",
        scope: "global",
        key: "user.signingKey",
      });
    });
  });

  describe("getGitconfigPath", () => {
    it("invokes with scope", async () => {
      mockedInvoke.mockResolvedValueOnce("/home/user/.gitconfig");

      const result = await getGitconfigPath("tab-1", "global");

      expect(mockedInvoke).toHaveBeenCalledWith("get_gitconfig_path", {
        tabId: "tab-1",
        scope: "global",
      });
      expect(result).toBe("/home/user/.gitconfig");
    });
  });
});
