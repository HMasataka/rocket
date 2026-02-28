use tauri::State;

use crate::git::types::SubmoduleInfo;
use crate::state::AppState;

#[tauri::command]
pub fn list_submodules(state: State<'_, AppState>) -> Result<Vec<SubmoduleInfo>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.list_submodules().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_submodule(url: String, path: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .add_submodule(&url, &path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_submodule(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .update_submodule(&path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_all_submodules(state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.update_all_submodules().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_submodule(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .remove_submodule(&path)
        .map_err(|e| e.to_string())
}
