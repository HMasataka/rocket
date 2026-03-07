use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{CherryPickMode, CherryPickResult};
use crate::state::AppState;

#[tauri::command]
pub fn cherry_pick(
    tab_id: String,
    oids: Vec<String>,
    mode: CherryPickMode,
    state: State<'_, AppState>,
) -> Result<CherryPickResult, String> {
    with_repo(&state, &tab_id, |backend| {
        let oid_refs: Vec<&str> = oids.iter().map(|s| s.as_str()).collect();
        backend
            .cherry_pick(&oid_refs, mode)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn is_cherry_picking(tab_id: String, state: State<'_, AppState>) -> Result<bool, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.is_cherry_picking().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn abort_cherry_pick(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.abort_cherry_pick().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn continue_cherry_pick(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<CherryPickResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.continue_cherry_pick().map_err(|e| e.to_string())
    })
}
