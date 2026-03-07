use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{FileDiff, StashEntry};
use crate::state::AppState;

#[tauri::command]
pub fn stash_save(
    tab_id: String,
    message: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .stash_save(message.as_deref())
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn list_stashes(tab_id: String, state: State<'_, AppState>) -> Result<Vec<StashEntry>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.stash_list().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn apply_stash(tab_id: String, index: usize, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.stash_apply(index).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn pop_stash(tab_id: String, index: usize, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.stash_pop(index).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn drop_stash(tab_id: String, index: usize, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.stash_drop(index).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_stash_diff(
    tab_id: String,
    index: usize,
    state: State<'_, AppState>,
) -> Result<Vec<FileDiff>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.stash_diff(index).map_err(|e| e.to_string())
    })
}
