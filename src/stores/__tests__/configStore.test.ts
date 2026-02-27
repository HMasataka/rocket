import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { useConfigStore } from "../configStore";

const mockedInvoke = vi.mocked(invoke);

const mockConfig = {
  last_opened_repo: "/path/to/repo",
  ai: {
    commit_message_style: "conventional",
    commit_message_language: "en",
    provider_priority: ["openai"],
    prefer_local_llm: false,
    exclude_patterns: [],
  },
  appearance: {
    theme: "dark",
    color_theme: "cobalt",
    ui_font_size: 13,
    sidebar_position: "left",
    tab_style: "default",
  },
  editor: {
    font_family: "JetBrains Mono",
    font_size: 14,
    line_height: 20,
    show_line_numbers: true,
    word_wrap: false,
    show_whitespace: false,
    minimap: true,
    indent_style: "spaces",
    tab_size: 2,
  },
  keybindings: {
    preset: "default",
  },
  tools: {
    diff_tool: "",
    merge_tool: "",
    terminal: "",
    editor: "",
    git_path: "git",
    auto_fetch_on_open: true,
    auto_fetch_interval: 300,
    open_in_editor_on_double_click: false,
  },
};

describe("configStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfigStore.setState({
      config: null,
      loading: false,
      error: null,
    });
  });

  describe("loadConfig", () => {
    it("sets config on success", async () => {
      mockedInvoke.mockResolvedValueOnce(mockConfig);

      await useConfigStore.getState().loadConfig();

      const state = useConfigStore.getState();
      expect(state.config).toEqual(mockConfig);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets loading to true during fetch", async () => {
      let resolveFn: (v: unknown) => void;
      const promise = new Promise((resolve) => {
        resolveFn = resolve;
      });
      mockedInvoke.mockReturnValueOnce(promise);

      const loadPromise = useConfigStore.getState().loadConfig();
      expect(useConfigStore.getState().loading).toBe(true);

      resolveFn!(mockConfig);
      await loadPromise;
      expect(useConfigStore.getState().loading).toBe(false);
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("config error"));

      await expect(useConfigStore.getState().loadConfig()).rejects.toThrow();

      const state = useConfigStore.getState();
      expect(state.error).toContain("config error");
      expect(state.loading).toBe(false);
    });
  });

  describe("saveConfig", () => {
    it("updates config on success", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useConfigStore.getState().saveConfig(mockConfig);

      expect(useConfigStore.getState().config).toEqual(mockConfig);
      expect(mockedInvoke).toHaveBeenCalledWith("save_config", {
        config: mockConfig,
      });
    });

    it("sets error on failure", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("save error"));

      await expect(
        useConfigStore.getState().saveConfig(mockConfig),
      ).rejects.toThrow();

      expect(useConfigStore.getState().error).toContain("save error");
    });
  });

  describe("updateAppearance", () => {
    it("saves updated appearance on success", async () => {
      useConfigStore.setState({ config: mockConfig });
      mockedInvoke.mockResolvedValueOnce(undefined);

      const newAppearance = { ...mockConfig.appearance, theme: "light" };
      await useConfigStore.getState().updateAppearance(newAppearance);

      const state = useConfigStore.getState();
      expect(state.config?.appearance.theme).toBe("light");
      expect(mockedInvoke).toHaveBeenCalledWith("save_config", {
        config: { ...mockConfig, appearance: newAppearance },
      });
    });

    it("does nothing when config is null", async () => {
      useConfigStore.setState({ config: null });

      await useConfigStore.getState().updateAppearance(mockConfig.appearance);

      expect(mockedInvoke).not.toHaveBeenCalled();
    });

    it("sets error on failure", async () => {
      useConfigStore.setState({ config: mockConfig });
      mockedInvoke.mockRejectedValueOnce(new Error("appearance error"));

      await expect(
        useConfigStore.getState().updateAppearance(mockConfig.appearance),
      ).rejects.toThrow();

      expect(useConfigStore.getState().error).toContain("appearance error");
    });
  });
});
