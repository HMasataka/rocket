use tauri::State;

use crate::ai::adapter::LlmAdapter;
use crate::ai::detector;
use crate::ai::types::{
    AiConfig, CliAdapterInfo, CommitMessageStyle, GenerateRequest, GenerateResult, Language,
};
use crate::config;
use crate::state::AppState;

#[tauri::command]
pub fn detect_cli_adapters() -> Result<Vec<CliAdapterInfo>, String> {
    Ok(detector::detect_cli_adapters())
}

#[tauri::command]
pub fn generate_commit_message(
    format: String,
    language: String,
    state: State<'_, AppState>,
) -> Result<GenerateResult, String> {
    let style: CommitMessageStyle =
        serde_json::from_value(serde_json::Value::String(format))
            .map_err(|e| format!("Invalid format: {e}"))?;
    let lang: Language =
        serde_json::from_value(serde_json::Value::String(language))
            .map_err(|e| format!("Invalid language: {e}"))?;

    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;

    let diff_options = crate::git::types::DiffOptions {
        staged: true,
        ..Default::default()
    };
    let diffs = backend.diff(None, &diff_options).map_err(|e| e.to_string())?;

    let diff_text = diffs
        .iter()
        .map(|d| {
            let path = d.new_path.as_deref().or(d.old_path.as_deref()).unwrap_or("unknown");
            let hunks: String = d
                .hunks
                .iter()
                .map(|h| {
                    let lines: String = h
                        .lines
                        .iter()
                        .map(|l| l.content.as_str())
                        .collect::<Vec<_>>()
                        .join("\n");
                    format!("{}\n{}", h.header, lines)
                })
                .collect::<Vec<_>>()
                .join("\n");
            format!("--- {path}\n{hunks}")
        })
        .collect::<Vec<_>>()
        .join("\n\n");

    if diff_text.trim().is_empty() {
        return Err("No staged changes to generate a commit message from".to_string());
    }

    let ai_config = config::load_config()
        .map(|c| c.ai)
        .unwrap_or_default();

    let adapter = detector::first_available_adapter_with_priority(&ai_config.provider_priority)
        .ok_or("No AI CLI adapter available. Install one of: claude, codex, gemini, aider, llm")?;

    let request = GenerateRequest {
        diff: diff_text,
        style,
        language: lang,
    };

    adapter.generate(&request).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_ai_config() -> Result<AiConfig, String> {
    let cfg = config::load_config().map_err(|e| e.to_string())?;
    Ok(cfg.ai)
}

#[tauri::command]
pub fn save_ai_config(ai_config: AiConfig) -> Result<(), String> {
    let mut cfg = config::load_config().map_err(|e| e.to_string())?;
    cfg.ai = ai_config;
    config::save_config(&cfg).map_err(|e| e.to_string())
}
