use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{GitConfigEntry, GitConfigScope};
use crate::state::AppState;

#[tauri::command]
pub fn get_gitconfig_entries(
    tab_id: String,
    scope: GitConfigScope,
    state: State<'_, AppState>,
) -> Result<Vec<GitConfigEntry>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_gitconfig_entries(scope)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_gitconfig_value(
    tab_id: String,
    scope: GitConfigScope,
    key: String,
    state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .get_gitconfig_value(scope, &key)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn set_gitconfig_value(
    tab_id: String,
    scope: GitConfigScope,
    key: String,
    value: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .set_gitconfig_value(scope, &key, &value)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn unset_gitconfig_value(
    tab_id: String,
    scope: GitConfigScope,
    key: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .unset_gitconfig_value(scope, &key)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_gitconfig_path(
    tab_id: String,
    scope: GitConfigScope,
    state: State<'_, AppState>,
) -> Result<String, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.get_gitconfig_path(scope).map_err(|e| e.to_string())
    })
}
