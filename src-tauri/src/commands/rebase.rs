use tauri::State;

use crate::git::types::{MergeBaseContent, RebaseResult, RebaseState, RebaseTodoEntry};
use crate::state::AppState;

#[tauri::command]
pub fn rebase(onto: String, state: State<'_, AppState>) -> Result<RebaseResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.rebase(&onto).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn interactive_rebase(
    onto: String,
    todo: Vec<RebaseTodoEntry>,
    state: State<'_, AppState>,
) -> Result<RebaseResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .interactive_rebase(&onto, &todo)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_rebasing(state: State<'_, AppState>) -> Result<bool, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.is_rebasing().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn abort_rebase(state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.abort_rebase().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn continue_rebase(state: State<'_, AppState>) -> Result<RebaseResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.continue_rebase().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_rebase_state(state: State<'_, AppState>) -> Result<Option<RebaseState>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.get_rebase_state().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_rebase_todo(
    onto: String,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<RebaseTodoEntry>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_rebase_todo(&onto, limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_merge_base_content(
    path: String,
    state: State<'_, AppState>,
) -> Result<MergeBaseContent, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_merge_base_content(&path)
        .map_err(|e| e.to_string())
}
