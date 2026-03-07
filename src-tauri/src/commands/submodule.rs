use tauri::State;

use crate::commands::with_repo;
use crate::git::types::SubmoduleInfo;
use crate::state::AppState;

#[tauri::command]
pub fn list_submodules(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<SubmoduleInfo>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.list_submodules().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn add_submodule(
    tab_id: String,
    url: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .add_submodule(&url, &path)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn update_submodule(
    tab_id: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.update_submodule(&path).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn update_all_submodules(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.update_all_submodules().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn remove_submodule(
    tab_id: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.remove_submodule(&path).map_err(|e| e.to_string())
    })
}
