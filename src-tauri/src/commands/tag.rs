use tauri::State;

use crate::commands::with_repo;
use crate::git::types::TagInfo;
use crate::state::AppState;

#[tauri::command]
pub fn list_tags(tab_id: String, state: State<'_, AppState>) -> Result<Vec<TagInfo>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.list_tags().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn create_tag(
    tab_id: String,
    name: String,
    message: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .create_tag(&name, message.as_deref())
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn delete_tag(tab_id: String, name: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.delete_tag(&name).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn checkout_tag(
    tab_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.checkout_tag(&name).map_err(|e| e.to_string())
    })
}
