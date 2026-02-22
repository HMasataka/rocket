use tauri::State;

use crate::git::types::{
    BlameResult, CommitDetail, CommitInfo, CommitLogResult, FileDiff, LogFilter,
};
use crate::state::AppState;

#[tauri::command]
pub fn get_commit_log(
    filter: LogFilter,
    limit: usize,
    skip: usize,
    state: State<'_, AppState>,
) -> Result<CommitLogResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_commit_log(&filter, limit, skip)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_detail(oid: String, state: State<'_, AppState>) -> Result<CommitDetail, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.get_commit_detail(&oid).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_file_diff(
    oid: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<Vec<FileDiff>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_commit_file_diff(&oid, &path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_blame(
    path: String,
    commit_oid: Option<String>,
    state: State<'_, AppState>,
) -> Result<BlameResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_blame(&path, commit_oid.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_file_history(
    path: String,
    limit: usize,
    skip: usize,
    state: State<'_, AppState>,
) -> Result<Vec<CommitInfo>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_file_history(&path, limit, skip)
        .map_err(|e| e.to_string())
}
