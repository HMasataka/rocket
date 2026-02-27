use tauri::State;

use crate::git::search::{CodeSearchResult, CommitSearchResult, FilenameSearchResult};
use crate::state::AppState;

#[tauri::command]
pub fn search_code(
    query: String,
    is_regex: bool,
    state: State<'_, AppState>,
) -> Result<Vec<CodeSearchResult>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .search_code(&query, is_regex)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_commits(
    query: String,
    search_diff: bool,
    state: State<'_, AppState>,
) -> Result<Vec<CommitSearchResult>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .search_commits(&query, search_diff)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_filenames(
    query: String,
    state: State<'_, AppState>,
) -> Result<Vec<FilenameSearchResult>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .search_filenames(&query)
        .map_err(|e| e.to_string())
}
