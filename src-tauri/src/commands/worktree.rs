use tauri::State;

use crate::commands::with_repo;
use crate::git::types::WorktreeInfo;
use crate::state::AppState;

#[tauri::command]
pub fn list_worktrees(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<WorktreeInfo>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.list_worktrees().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn add_worktree(
    tab_id: String,
    path: String,
    branch: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .add_worktree(&path, &branch)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn remove_worktree(
    tab_id: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.remove_worktree(&path).map_err(|e| e.to_string())
    })
}
