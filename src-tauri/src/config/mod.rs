use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::ai::types::AiConfig;
use crate::git::error::{GitError, GitResult};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub last_opened_repo: Option<String>,
    #[serde(default)]
    pub ai: AiConfig,
    #[serde(default)]
    pub appearance: AppearanceConfig,
    #[serde(default)]
    pub editor: EditorConfig,
    #[serde(default)]
    pub keybindings: KeybindingsConfig,
    #[serde(default)]
    pub tools: ToolsConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceConfig {
    pub theme: String,
    pub color_theme: String,
    pub ui_font_size: u32,
    pub sidebar_position: String,
    pub tab_style: String,
}

impl Default for AppearanceConfig {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            color_theme: "cobalt".to_string(),
            ui_font_size: 13,
            sidebar_position: "left".to_string(),
            tab_style: "default".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorConfig {
    pub font_family: String,
    pub font_size: u32,
    pub line_height: u32,
    pub show_line_numbers: bool,
    pub word_wrap: bool,
    pub show_whitespace: bool,
    pub minimap: bool,
    pub indent_style: String,
    pub tab_size: u32,
}

impl Default for EditorConfig {
    fn default() -> Self {
        Self {
            font_family: "JetBrains Mono".to_string(),
            font_size: 14,
            line_height: 20,
            show_line_numbers: true,
            word_wrap: false,
            show_whitespace: false,
            minimap: true,
            indent_style: "spaces".to_string(),
            tab_size: 2,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeybindingsConfig {
    pub preset: String,
}

impl Default for KeybindingsConfig {
    fn default() -> Self {
        Self {
            preset: "default".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolsConfig {
    pub diff_tool: String,
    pub merge_tool: String,
    pub terminal: String,
    pub editor: String,
    pub git_path: String,
    pub auto_fetch_on_open: bool,
    pub auto_fetch_interval: u32,
    pub open_in_editor_on_double_click: bool,
}

impl Default for ToolsConfig {
    fn default() -> Self {
        Self {
            diff_tool: "builtin".to_string(),
            merge_tool: "builtin".to_string(),
            terminal: "default".to_string(),
            editor: "vscode".to_string(),
            git_path: "/usr/bin/git".to_string(),
            auto_fetch_on_open: true,
            auto_fetch_interval: 300,
            open_in_editor_on_double_click: true,
        }
    }
}

fn config_path() -> GitResult<PathBuf> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| GitError::ConfigReadFailed("config directory not found".into()))?;
    Ok(config_dir.join("rocket").join("config.toml"))
}

pub fn load_config() -> GitResult<AppConfig> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| GitError::ConfigReadFailed(Box::new(e)))?;
    let config: AppConfig =
        toml::from_str(&content).map_err(|e| GitError::ConfigReadFailed(Box::new(e)))?;
    Ok(config)
}

pub fn save_config(config: &AppConfig) -> GitResult<()> {
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| GitError::ConfigWriteFailed(Box::new(e)))?;
    }
    let content = toml::to_string(config).map_err(|e| GitError::ConfigWriteFailed(Box::new(e)))?;
    fs::write(&path, content).map_err(|e| GitError::ConfigWriteFailed(Box::new(e)))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_no_last_opened_repo() {
        let config = AppConfig::default();
        assert!(config.last_opened_repo.is_none());
    }

    #[test]
    fn config_serialization_roundtrip() {
        let config = AppConfig {
            last_opened_repo: Some("/tmp/test-repo".to_string()),
            ai: AiConfig::default(),
            appearance: AppearanceConfig::default(),
            editor: EditorConfig::default(),
            keybindings: KeybindingsConfig::default(),
            tools: ToolsConfig::default(),
        };
        let serialized = toml::to_string(&config).unwrap();
        let deserialized: AppConfig = toml::from_str(&serialized).unwrap();
        assert_eq!(
            deserialized.last_opened_repo,
            Some("/tmp/test-repo".to_string())
        );
    }

    #[test]
    fn config_deserializes_empty_toml() {
        let config: AppConfig = toml::from_str("").unwrap();
        assert!(config.last_opened_repo.is_none());
    }

    #[test]
    fn appearance_config_defaults() {
        let config = AppearanceConfig::default();
        assert_eq!(config.theme, "dark");
        assert_eq!(config.color_theme, "cobalt");
        assert_eq!(config.ui_font_size, 13);
        assert_eq!(config.sidebar_position, "left");
        assert_eq!(config.tab_style, "default");
    }

    #[test]
    fn editor_config_defaults() {
        let config = EditorConfig::default();
        assert_eq!(config.font_family, "JetBrains Mono");
        assert_eq!(config.font_size, 14);
        assert_eq!(config.line_height, 20);
        assert!(config.show_line_numbers);
        assert!(!config.word_wrap);
        assert!(!config.show_whitespace);
        assert!(config.minimap);
        assert_eq!(config.indent_style, "spaces");
        assert_eq!(config.tab_size, 2);
    }

    #[test]
    fn keybindings_config_defaults() {
        let config = KeybindingsConfig::default();
        assert_eq!(config.preset, "default");
    }

    #[test]
    fn tools_config_defaults() {
        let config = ToolsConfig::default();
        assert_eq!(config.diff_tool, "builtin");
        assert_eq!(config.merge_tool, "builtin");
        assert_eq!(config.terminal, "default");
        assert_eq!(config.editor, "vscode");
        assert_eq!(config.git_path, "/usr/bin/git");
        assert!(config.auto_fetch_on_open);
        assert_eq!(config.auto_fetch_interval, 300);
        assert!(config.open_in_editor_on_double_click);
    }

    #[test]
    fn config_deserializes_partial_toml_with_new_sections() {
        let toml_str = r#"
last_opened_repo = "/tmp/repo"

[appearance]
theme = "light"
color_theme = "emerald"
ui_font_size = 15
sidebar_position = "right"
tab_style = "compact"
"#;
        let config: AppConfig = toml::from_str(toml_str).unwrap();
        assert_eq!(config.last_opened_repo, Some("/tmp/repo".to_string()));
        assert_eq!(config.appearance.theme, "light");
        assert_eq!(config.appearance.color_theme, "emerald");
        assert_eq!(config.appearance.ui_font_size, 15);
        assert_eq!(config.appearance.sidebar_position, "right");
        assert_eq!(config.appearance.tab_style, "compact");
        // Other sections should use defaults
        assert_eq!(config.editor.font_size, 14);
        assert_eq!(config.keybindings.preset, "default");
        assert_eq!(config.tools.diff_tool, "builtin");
    }

    #[test]
    fn config_full_roundtrip_with_all_sections() {
        let config = AppConfig {
            last_opened_repo: Some("/tmp/test".to_string()),
            ai: AiConfig::default(),
            appearance: AppearanceConfig {
                theme: "light".to_string(),
                color_theme: "rose".to_string(),
                ui_font_size: 16,
                sidebar_position: "right".to_string(),
                tab_style: "compact".to_string(),
            },
            editor: EditorConfig {
                font_family: "Fira Code".to_string(),
                font_size: 16,
                line_height: 24,
                show_line_numbers: false,
                word_wrap: true,
                show_whitespace: true,
                minimap: false,
                indent_style: "tabs".to_string(),
                tab_size: 4,
            },
            keybindings: KeybindingsConfig {
                preset: "vim".to_string(),
            },
            tools: ToolsConfig {
                diff_tool: "vscode".to_string(),
                merge_tool: "meld".to_string(),
                terminal: "iterm".to_string(),
                editor: "cursor".to_string(),
                git_path: "/opt/homebrew/bin/git".to_string(),
                auto_fetch_on_open: false,
                auto_fetch_interval: 600,
                open_in_editor_on_double_click: false,
            },
        };
        let serialized = toml::to_string(&config).unwrap();
        let deserialized: AppConfig = toml::from_str(&serialized).unwrap();
        assert_eq!(deserialized.appearance.theme, "light");
        assert_eq!(deserialized.appearance.color_theme, "rose");
        assert_eq!(deserialized.editor.font_family, "Fira Code");
        assert_eq!(deserialized.editor.tab_size, 4);
        assert_eq!(deserialized.keybindings.preset, "vim");
        assert_eq!(deserialized.tools.diff_tool, "vscode");
        assert!(!deserialized.tools.auto_fetch_on_open);
    }
}
