use tauri::State;

use crate::git::types::{FileDiff, StashEntry};
use crate::state::AppState;

#[tauri::command]
pub fn stash_save(message: Option<String>, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .stash_save(message.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_stashes(state: State<'_, AppState>) -> Result<Vec<StashEntry>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.stash_list().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn apply_stash(index: usize, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.stash_apply(index).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn pop_stash(index: usize, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.stash_pop(index).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn drop_stash(index: usize, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.stash_drop(index).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_stash_diff(index: usize, state: State<'_, AppState>) -> Result<Vec<FileDiff>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.stash_diff(index).map_err(|e| e.to_string())
}
