use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{FetchResult, MergeResult, PullOption, PushResult, RemoteInfo};
use crate::state::AppState;

#[tauri::command]
pub fn fetch_remote(
    tab_id: String,
    remote_name: String,
    state: State<'_, AppState>,
) -> Result<FetchResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.fetch(&remote_name).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn pull_remote(
    tab_id: String,
    remote_name: String,
    option: PullOption,
    state: State<'_, AppState>,
) -> Result<MergeResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .pull(&remote_name, option)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn push_remote(
    tab_id: String,
    remote_name: String,
    state: State<'_, AppState>,
) -> Result<PushResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.push(&remote_name).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn list_remotes(tab_id: String, state: State<'_, AppState>) -> Result<Vec<RemoteInfo>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.list_remotes().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn add_remote(
    tab_id: String,
    name: String,
    url: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.add_remote(&name, &url).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn remove_remote(
    tab_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.remove_remote(&name).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn edit_remote(
    tab_id: String,
    name: String,
    new_url: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .edit_remote(&name, &new_url)
            .map_err(|e| e.to_string())
    })
}
