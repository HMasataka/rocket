use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{CommitResult, ConflictFile, ConflictResolution};
use crate::state::AppState;

#[tauri::command]
pub fn get_conflict_files(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<ConflictFile>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.get_conflict_files().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn resolve_conflict(
    tab_id: String,
    path: String,
    resolution: ConflictResolution,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .resolve_conflict(&path, resolution)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn resolve_conflict_block(
    tab_id: String,
    path: String,
    block_index: usize,
    resolution: ConflictResolution,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .resolve_conflict_block(&path, block_index, resolution)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn mark_resolved(
    tab_id: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.mark_resolved(&path).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn abort_merge(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.abort_merge().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn continue_merge(
    tab_id: String,
    message: String,
    state: State<'_, AppState>,
) -> Result<CommitResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.continue_merge(&message).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn is_merging(tab_id: String, state: State<'_, AppState>) -> Result<bool, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.is_merging().map_err(|e| e.to_string())
    })
}
