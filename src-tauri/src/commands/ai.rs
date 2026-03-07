use tauri::State;

use crate::ai::adapter::LlmAdapter;
use crate::ai::detector;
use crate::ai::types::{
    AiConfig, CliAdapterInfo, CommitMessageStyle, ConflictSuggestion, GenerateRequest,
    GenerateResult, Language, ReviewResult,
};
use crate::commands::with_repo;
use crate::config;
use crate::git::types::FileDiff;
use crate::state::AppState;

fn format_diff_text(diffs: &[FileDiff]) -> String {
    diffs
        .iter()
        .map(|d| {
            let path = d
                .new_path
                .as_deref()
                .or(d.old_path.as_deref())
                .unwrap_or("unknown");
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
        .join("\n\n")
}

fn get_adapter() -> Result<crate::ai::adapter::CliAdapter, String> {
    let ai_config = config::load_config().map(|c| c.ai).unwrap_or_default();

    detector::first_available_adapter_with_priority(&ai_config.provider_priority).ok_or_else(|| {
        "No AI CLI adapter available. Install one of: claude, codex, gemini, aider, llm".to_string()
    })
}

#[tauri::command]
pub fn detect_cli_adapters() -> Result<Vec<CliAdapterInfo>, String> {
    Ok(detector::detect_cli_adapters())
}

#[tauri::command]
pub fn generate_commit_message(
    tab_id: String,
    format: String,
    language: String,
    state: State<'_, AppState>,
) -> Result<GenerateResult, String> {
    let style: CommitMessageStyle = serde_json::from_value(serde_json::Value::String(format))
        .map_err(|e| format!("Invalid format: {e}"))?;
    let lang: Language = serde_json::from_value(serde_json::Value::String(language))
        .map_err(|e| format!("Invalid language: {e}"))?;

    let diff_text = with_repo(&state, &tab_id, |backend| {
        let diff_options = crate::git::types::DiffOptions {
            staged: true,
            ..Default::default()
        };
        let diffs = backend
            .diff(None, &diff_options)
            .map_err(|e| e.to_string())?;
        Ok(format_diff_text(&diffs))
    })?;

    if diff_text.trim().is_empty() {
        return Err("No staged changes to generate a commit message from".to_string());
    }

    let adapter = get_adapter()?;

    let request = GenerateRequest {
        diff: diff_text,
        style,
        language: lang,
    };

    adapter.generate(&request).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn review_diff(tab_id: String, state: State<'_, AppState>) -> Result<ReviewResult, String> {
    let (staged_diffs, unstaged_diffs) = with_repo(&state, &tab_id, |backend| {
        let staged_options = crate::git::types::DiffOptions {
            staged: true,
            ..Default::default()
        };
        let unstaged_options = crate::git::types::DiffOptions {
            staged: false,
            ..Default::default()
        };

        let staged = backend
            .diff(None, &staged_options)
            .map_err(|e| e.to_string())?;
        let unstaged = backend
            .diff(None, &unstaged_options)
            .map_err(|e| e.to_string())?;
        Ok((staged, unstaged))
    })?;

    let mut all_diffs = staged_diffs;
    all_diffs.extend(unstaged_diffs);

    let diff_text = format_diff_text(&all_diffs);

    if diff_text.trim().is_empty() {
        return Ok(ReviewResult {
            comments: Vec::new(),
        });
    }

    let adapter = get_adapter()?;
    let prompt = crate::ai::review::build_review_prompt(&diff_text);
    let raw = adapter.execute_prompt(&prompt).map_err(|e| e.to_string())?;
    crate::ai::review::parse_review_response(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ai_resolve_conflict(
    ours: String,
    theirs: String,
    base: Option<String>,
) -> Result<ConflictSuggestion, String> {
    let adapter = get_adapter()?;
    let prompt =
        crate::ai::conflict::build_conflict_resolve_prompt(&ours, &theirs, base.as_deref());
    let raw = adapter.execute_prompt(&prompt).map_err(|e| e.to_string())?;
    crate::ai::conflict::parse_conflict_response(&raw).map_err(|e| e.to_string())
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
