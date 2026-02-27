use tauri::State;

use crate::git::types::{RevertMode, RevertResult};
use crate::state::AppState;

#[tauri::command]
pub fn revert(
    oid: String,
    mode: RevertMode,
    state: State<'_, AppState>,
) -> Result<RevertResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.revert(&oid, mode).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_reverting(state: State<'_, AppState>) -> Result<bool, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.is_reverting().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn abort_revert(state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.abort_revert().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn continue_revert(state: State<'_, AppState>) -> Result<RevertResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.continue_revert().map_err(|e| e.to_string())
}
