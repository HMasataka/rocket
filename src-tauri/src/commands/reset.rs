use tauri::State;

use crate::git::types::{ReflogEntry, ResetMode, ResetResult};
use crate::state::AppState;

#[tauri::command]
pub fn reset(
    oid: String,
    mode: ResetMode,
    state: State<'_, AppState>,
) -> Result<ResetResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.reset(&oid, mode).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_file(
    path: String,
    oid: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.reset_file(&path, &oid).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_reflog(
    ref_name: String,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<ReflogEntry>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_reflog(&ref_name, limit)
        .map_err(|e| e.to_string())
}
