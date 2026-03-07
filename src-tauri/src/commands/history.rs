use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{
    BlameResult, CommitDetail, CommitInfo, CommitLogResult, FileDiff, LogFilter,
};
use crate::state::AppState;

#[tauri::command]
pub fn get_commit_log(
    tab_id: String,
    filter: LogFilter,
    limit: usize,
    skip: usize,
    state: State<'_, AppState>,
) -> Result<CommitLogResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_commit_log(&filter, limit, skip)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_commit_detail(
    tab_id: String,
    oid: String,
    state: State<'_, AppState>,
) -> Result<CommitDetail, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.get_commit_detail(&oid).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_commit_file_diff(
    tab_id: String,
    oid: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<Vec<FileDiff>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_commit_file_diff(&oid, &path)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_blame(
    tab_id: String,
    path: String,
    commit_oid: Option<String>,
    state: State<'_, AppState>,
) -> Result<BlameResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_blame(&path, commit_oid.as_deref())
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_file_history(
    tab_id: String,
    path: String,
    limit: usize,
    skip: usize,
    state: State<'_, AppState>,
) -> Result<Vec<CommitInfo>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_file_history(&path, limit, skip)
            .map_err(|e| e.to_string())
    })
}
