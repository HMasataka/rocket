use tauri::State;

use crate::git::types::{BranchInfo, CommitInfo, MergeOption, MergeResult};
use crate::state::AppState;

#[tauri::command]
pub fn list_branches(state: State<'_, AppState>) -> Result<Vec<BranchInfo>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.list_branches().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_branch(name: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.create_branch(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_branch(name: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.checkout_branch(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_branch(name: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.delete_branch(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_branch(
    old_name: String,
    new_name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .rename_branch(&old_name, &new_name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_branch(
    branch_name: String,
    option: MergeOption,
    state: State<'_, AppState>,
) -> Result<MergeResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .merge_branch(&branch_name, option)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_branch_commits(
    branch_name: String,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<CommitInfo>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_branch_commits(&branch_name, limit)
        .map_err(|e| e.to_string())
}
