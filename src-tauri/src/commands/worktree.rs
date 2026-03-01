use tauri::State;

use crate::git::types::WorktreeInfo;
use crate::state::AppState;

#[tauri::command]
pub fn list_worktrees(state: State<'_, AppState>) -> Result<Vec<WorktreeInfo>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.list_worktrees().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_worktree(
    path: String,
    branch: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .add_worktree(&path, &branch)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_worktree(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .remove_worktree(&path)
        .map_err(|e| e.to_string())
}
