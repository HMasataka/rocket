use tauri::State;

use crate::ai::adapter::LlmAdapter;
use crate::ai::detector;
use crate::ai::types::{
    AiConfig, CliAdapterInfo, CommitMessageStyle, ConflictSuggestion, GenerateRequest,
    GenerateResult, Language, PrDescription, ReviewResult,
};
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
    let ai_config = config::load_config()
        .map(|c| c.ai)
        .unwrap_or_default();

    detector::first_available_adapter_with_priority(&ai_config.provider_priority)
        .ok_or_else(|| {
            "No AI CLI adapter available. Install one of: claude, codex, gemini, aider, llm"
                .to_string()
        })
}

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
    let lang: Language = serde_json::from_value(serde_json::Value::String(language))
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
    let diffs = backend
        .diff(None, &diff_options)
        .map_err(|e| e.to_string())?;

    let diff_text = format_diff_text(&diffs);

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
pub fn review_diff(state: State<'_, AppState>) -> Result<ReviewResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;

    let staged_options = crate::git::types::DiffOptions {
        staged: true,
        ..Default::default()
    };
    let unstaged_options = crate::git::types::DiffOptions {
        staged: false,
        ..Default::default()
    };

    let staged_diffs = backend
        .diff(None, &staged_options)
        .map_err(|e| e.to_string())?;
    let unstaged_diffs = backend
        .diff(None, &unstaged_options)
        .map_err(|e| e.to_string())?;

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
pub fn generate_pr_description(state: State<'_, AppState>) -> Result<PrDescription, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;

    let branch_name = backend.current_branch().map_err(|e| e.to_string())?;

    let diff_options = crate::git::types::DiffOptions {
        staged: true,
        ..Default::default()
    };
    let diffs = backend
        .diff(None, &diff_options)
        .map_err(|e| e.to_string())?;

    let diff_text = format_diff_text(&diffs);

    if diff_text.trim().is_empty() {
        return Err("No changes to generate a PR description from".to_string());
    }

    let adapter = get_adapter()?;
    let prompt = crate::ai::pr::build_pr_description_prompt(&diff_text, &branch_name);
    let raw = adapter.execute_prompt(&prompt).map_err(|e| e.to_string())?;
    crate::ai::pr::parse_pr_description_response(&raw).map_err(|e| e.to_string())
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
