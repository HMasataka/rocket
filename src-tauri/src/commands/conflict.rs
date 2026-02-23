use tauri::State;

use crate::git::types::{CommitResult, ConflictFile, ConflictResolution};
use crate::state::AppState;

#[tauri::command]
pub fn get_conflict_files(state: State<'_, AppState>) -> Result<Vec<ConflictFile>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.get_conflict_files().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn resolve_conflict(
    path: String,
    resolution: ConflictResolution,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .resolve_conflict(&path, resolution)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn resolve_conflict_block(
    path: String,
    block_index: usize,
    resolution: ConflictResolution,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .resolve_conflict_block(&path, block_index, resolution)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_resolved(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.mark_resolved(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn abort_merge(state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.abort_merge().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn continue_merge(message: String, state: State<'_, AppState>) -> Result<CommitResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .continue_merge(&message)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_merging(state: State<'_, AppState>) -> Result<bool, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.is_merging().map_err(|e| e.to_string())
}
