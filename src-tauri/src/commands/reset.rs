use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{ReflogEntry, ResetMode, ResetResult};
use crate::state::AppState;

#[tauri::command]
pub fn reset(
    tab_id: String,
    oid: String,
    mode: ResetMode,
    state: State<'_, AppState>,
) -> Result<ResetResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.reset(&oid, mode).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn reset_file(
    tab_id: String,
    path: String,
    oid: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.reset_file(&path, &oid).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_reflog(
    tab_id: String,
    ref_name: String,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<ReflogEntry>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_reflog(&ref_name, limit)
            .map_err(|e| e.to_string())
    })
}
