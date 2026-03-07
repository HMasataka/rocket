use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{MergeBaseContent, RebaseResult, RebaseState, RebaseTodoEntry};
use crate::state::AppState;

#[tauri::command]
pub fn rebase(
    tab_id: String,
    onto: String,
    state: State<'_, AppState>,
) -> Result<RebaseResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.rebase(&onto).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn interactive_rebase(
    tab_id: String,
    onto: String,
    todo: Vec<RebaseTodoEntry>,
    state: State<'_, AppState>,
) -> Result<RebaseResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .interactive_rebase(&onto, &todo)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn is_rebasing(tab_id: String, state: State<'_, AppState>) -> Result<bool, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.is_rebasing().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn abort_rebase(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.abort_rebase().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn continue_rebase(tab_id: String, state: State<'_, AppState>) -> Result<RebaseResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.continue_rebase().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_rebase_state(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<Option<RebaseState>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.get_rebase_state().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_rebase_todo(
    tab_id: String,
    onto: String,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<RebaseTodoEntry>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_rebase_todo(&onto, limit)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_merge_base_content(
    tab_id: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<MergeBaseContent, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_merge_base_content(&path)
            .map_err(|e| e.to_string())
    })
}
