use tauri::State;

use crate::git::types::TagInfo;
use crate::state::AppState;

#[tauri::command]
pub fn list_tags(state: State<'_, AppState>) -> Result<Vec<TagInfo>, String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.list_tags().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_tag(
    name: String,
    message: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend
        .create_tag(&name, message.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_tag(name: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.delete_tag(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_tag(name: String, state: State<'_, AppState>) -> Result<(), String> {
    let repo_lock = state
        .repo
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let backend = repo_lock.as_ref().ok_or("No repository opened")?;
    backend.checkout_tag(&name).map_err(|e| e.to_string())
}
