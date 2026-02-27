use tauri::State;

use crate::git::types::{CherryPickMode, CherryPickResult};
use crate::state::AppState;

#[tauri::command]
pub fn cherry_pick(
    oids: Vec<String>,
    mode: CherryPickMode,
    state: State<'_, AppState>,
) -> Result<CherryPickResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    let oid_refs: Vec<&str> = oids.iter().map(|s| s.as_str()).collect();
    backend
        .cherry_pick(&oid_refs, mode)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_cherry_picking(state: State<'_, AppState>) -> Result<bool, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.is_cherry_picking().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn abort_cherry_pick(state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.abort_cherry_pick().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn continue_cherry_pick(state: State<'_, AppState>) -> Result<CherryPickResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.continue_cherry_pick().map_err(|e| e.to_string())
}
