use tauri::State;

use crate::git::types::{FetchResult, MergeResult, PullOption, PushResult, RemoteInfo};
use crate::state::AppState;

#[tauri::command]
pub fn fetch_remote(
    remote_name: String,
    state: State<'_, AppState>,
) -> Result<FetchResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.fetch(&remote_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn pull_remote(
    remote_name: String,
    option: PullOption,
    state: State<'_, AppState>,
) -> Result<MergeResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .pull(&remote_name, option)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn push_remote(remote_name: String, state: State<'_, AppState>) -> Result<PushResult, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.push(&remote_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_remotes(state: State<'_, AppState>) -> Result<Vec<RemoteInfo>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.list_remotes().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_remote(name: String, url: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.add_remote(&name, &url).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_remote(name: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.remove_remote(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn edit_remote(
    name: String,
    new_url: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .edit_remote(&name, &new_url)
        .map_err(|e| e.to_string())
}
