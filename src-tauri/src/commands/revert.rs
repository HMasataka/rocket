use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{RevertMode, RevertResult};
use crate::state::AppState;

#[tauri::command]
pub fn revert(
    tab_id: String,
    oid: String,
    mode: RevertMode,
    state: State<'_, AppState>,
) -> Result<RevertResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.revert(&oid, mode).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn is_reverting(tab_id: String, state: State<'_, AppState>) -> Result<bool, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.is_reverting().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn abort_revert(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.abort_revert().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn continue_revert(tab_id: String, state: State<'_, AppState>) -> Result<RevertResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.continue_revert().map_err(|e| e.to_string())
    })
}
