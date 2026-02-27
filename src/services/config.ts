import { invoke } from "@tauri-apps/api/core";

export interface AppearanceConfig {
  theme: string;
  color_theme: string;
  ui_font_size: number;
  sidebar_position: string;
  tab_style: string;
}

export interface EditorConfig {
  font_family: string;
  font_size: number;
  line_height: number;
  show_line_numbers: boolean;
  word_wrap: boolean;
  show_whitespace: boolean;
  minimap: boolean;
  indent_style: string;
  tab_size: number;
}

export interface KeybindingsConfig {
  preset: string;
}

export interface ToolsConfig {
  diff_tool: string;
  merge_tool: string;
  terminal: string;
  editor: string;
  git_path: string;
  auto_fetch_on_open: boolean;
  auto_fetch_interval: number;
  open_in_editor_on_double_click: boolean;
}

export interface AiConfig {
  commit_message_style: string;
  commit_message_language: string;
  provider_priority: string[];
  prefer_local_llm: boolean;
  exclude_patterns: string[];
}

export interface AppConfig {
  last_opened_repo: string | null;
  ai: AiConfig;
  appearance: AppearanceConfig;
  editor: EditorConfig;
  keybindings: KeybindingsConfig;
  tools: ToolsConfig;
}

export function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>("get_config");
}

export function saveConfig(config: AppConfig): Promise<void> {
  return invoke<void>("save_config", { config });
}
