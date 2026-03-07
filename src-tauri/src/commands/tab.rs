use serde::Serialize;
use tauri::{AppHandle, State};

use crate::git::dispatcher::GitDispatcher;
use crate::state::{AppState, TabId};

#[derive(Debug, Serialize)]
pub struct TabInfo {
    pub id: String,
    pub name: String,
    pub path: String,
}

#[tauri::command]
pub fn open_tab(
    path: String,
    tab_id: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let backend = GitDispatcher::open_default(&path).map_err(|e| e.to_string())?;
    super::repo::setup_repo_after_open(backend, &app_handle, &state, &path, &tab_id)
}

#[tauri::command]
pub fn close_tab(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut tabs = state
        .tabs
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    tabs.remove(&tab_id);

    let mut active = state
        .active_tab
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    if active.as_deref() == Some(&tab_id) {
        *active = tabs.keys().next().cloned();
    }

    Ok(())
}

#[tauri::command]
pub fn set_active_tab(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let tabs = state
        .tabs
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    if !tabs.contains_key(&tab_id) {
        return Err("Tab not found".to_string());
    }
    drop(tabs);

    let mut active = state
        .active_tab
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    *active = Some(tab_id);

    Ok(())
}

#[tauri::command]
pub fn list_tabs(state: State<'_, AppState>) -> Result<Vec<TabInfo>, String> {
    let tabs = state
        .tabs
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    let mut result: Vec<TabInfo> = tabs
        .iter()
        .map(|(id, ctx)| TabInfo {
            id: id.clone(),
            name: ctx.name.clone(),
            path: ctx.path.clone(),
        })
        .collect();

    // Sort so active tab context is consistent
    result.sort_by(|a, b| a.id.cmp(&b.id));

    Ok(result)
}

#[tauri::command]
pub fn get_active_tab(state: State<'_, AppState>) -> Result<Option<TabId>, String> {
    let active = state
        .active_tab
        .lock()
        .map_err(|e| format!("Lock poisoned: {e}"))?;
    Ok(active.clone())
}
