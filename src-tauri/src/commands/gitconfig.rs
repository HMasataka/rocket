use tauri::State;

use crate::git::types::{GitConfigEntry, GitConfigScope};
use crate::state::AppState;

#[tauri::command]
pub fn get_gitconfig_entries(
    scope: GitConfigScope,
    state: State<'_, AppState>,
) -> Result<Vec<GitConfigEntry>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_gitconfig_entries(scope)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_gitconfig_value(
    scope: GitConfigScope,
    key: String,
    state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_gitconfig_value(scope, &key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_gitconfig_value(
    scope: GitConfigScope,
    key: String,
    value: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .set_gitconfig_value(scope, &key, &value)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unset_gitconfig_value(
    scope: GitConfigScope,
    key: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .unset_gitconfig_value(scope, &key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_gitconfig_path(
    scope: GitConfigScope,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .get_gitconfig_path(scope)
        .map_err(|e| e.to_string())
}
