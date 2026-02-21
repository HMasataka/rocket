use std::path::Path;

use tauri::State;

use crate::git::types::{CommitResult, DiffOptions, FileDiff, RepoStatus};
use crate::state::AppState;

#[tauri::command]
pub fn get_status(state: State<'_, AppState>) -> Result<RepoStatus, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.status().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_diff(
    path: Option<String>,
    staged: bool,
    state: State<'_, AppState>,
) -> Result<Vec<FileDiff>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    let options = DiffOptions {
        staged,
        ..Default::default()
    };
    let path_buf = path.map(std::path::PathBuf::from);
    backend
        .diff(path_buf.as_deref(), &options)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stage_file(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.stage(Path::new(&path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unstage_file(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.unstage(Path::new(&path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stage_all(state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.stage_all().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unstage_all(state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.unstage_all().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn commit(message: String, state: State<'_, AppState>) -> Result<CommitResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.commit(&message).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_current_branch(state: State<'_, AppState>) -> Result<String, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.current_branch().map_err(|e| e.to_string())
}
