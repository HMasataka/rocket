use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{BranchInfo, CommitInfo, MergeOption, MergeResult};
use crate::state::AppState;

#[tauri::command]
pub fn list_branches(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<BranchInfo>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.list_branches().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn create_branch(
    tab_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.create_branch(&name).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn checkout_branch(
    tab_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.checkout_branch(&name).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn delete_branch(
    tab_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.delete_branch(&name).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn rename_branch(
    tab_id: String,
    old_name: String,
    new_name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .rename_branch(&old_name, &new_name)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn merge_branch(
    tab_id: String,
    branch_name: String,
    option: MergeOption,
    state: State<'_, AppState>,
) -> Result<MergeResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .merge_branch(&branch_name, option)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_branch_commits(
    tab_id: String,
    branch_name: String,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<CommitInfo>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_branch_commits(&branch_name, limit)
            .map_err(|e| e.to_string())
    })
}
