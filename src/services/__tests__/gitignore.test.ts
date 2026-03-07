import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { getGitignoreTemplate, listGitignoreTemplates } from "../gitignore";

const mockedInvoke = vi.mocked(invoke);

describe("gitignore service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listGitignoreTemplates", () => {
    it("returns template names", async () => {
      const mockTemplates = ["Node", "Rust", "Python"];
      mockedInvoke.mockResolvedValueOnce(mockTemplates);

      const result = await listGitignoreTemplates();

      expect(mockedInvoke).toHaveBeenCalledWith("list_gitignore_templates");
      expect(result).toEqual(mockTemplates);
    });
  });

  describe("getGitignoreTemplate", () => {
    it("returns template content", async () => {
      const mockContent = "node_modules/\n.env\n";
      mockedInvoke.mockResolvedValueOnce(mockContent);

      const result = await getGitignoreTemplate("Node");

      expect(mockedInvoke).toHaveBeenCalledWith("get_gitignore_template", {
        name: "Node",
      });
      expect(result).toBe(mockContent);
    });
  });
});
