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

      const result = await getGitconfigEntries("local");

      expect(mockedInvoke).toHaveBeenCalledWith("get_gitconfig_entries", {
        scope: "local",
      });
      expect(result).toEqual(mockEntries);
    });
  });

  describe("getGitconfigValue", () => {
    it("invokes with scope and key", async () => {
      mockedInvoke.mockResolvedValueOnce("Test User");

      const result = await getGitconfigValue("global", "user.name");

      expect(mockedInvoke).toHaveBeenCalledWith("get_gitconfig_value", {
        scope: "global",
        key: "user.name",
      });
      expect(result).toBe("Test User");
    });

    it("returns null for missing key", async () => {
      mockedInvoke.mockResolvedValueOnce(null);

      const result = await getGitconfigValue("local", "nonexistent.key");

      expect(result).toBeNull();
    });
  });

  describe("setGitconfigValue", () => {
    it("invokes with scope, key, and value", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await setGitconfigValue("local", "user.name", "New Name");

      expect(mockedInvoke).toHaveBeenCalledWith("set_gitconfig_value", {
        scope: "local",
        key: "user.name",
        value: "New Name",
      });
    });
  });

  describe("unsetGitconfigValue", () => {
    it("invokes with scope and key", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await unsetGitconfigValue("global", "user.signingKey");

      expect(mockedInvoke).toHaveBeenCalledWith("unset_gitconfig_value", {
        scope: "global",
        key: "user.signingKey",
      });
    });
  });

  describe("getGitconfigPath", () => {
    it("invokes with scope", async () => {
      mockedInvoke.mockResolvedValueOnce("/home/user/.gitconfig");

      const result = await getGitconfigPath("global");

      expect(mockedInvoke).toHaveBeenCalledWith("get_gitconfig_path", {
        scope: "global",
      });
      expect(result).toBe("/home/user/.gitconfig");
    });
  });
});
