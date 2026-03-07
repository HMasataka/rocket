use tauri::{AppHandle, Emitter, State};

use crate::config::{self, RecentRepo};
use crate::git::dispatcher::GitDispatcher;
use crate::state::{self, AppState, RepoContext};
use crate::watcher;

pub(crate) fn setup_repo_after_open(
    backend: Box<dyn crate::git::backend::GitBackend>,
    app_handle: &AppHandle,
    state: &State<'_, AppState>,
    path: &str,
    tab_id: &str,
) -> Result<(), String> {
    let watch_path = backend.workdir().to_path_buf();
    let name = state::repo_name_from_path(path);

    let watcher_box = match watcher::start_watcher(app_handle.clone(), &watch_path, tab_id) {
        Ok(w) => Some(w),
        Err(e) => {
            log::error!("Failed to start watcher: {}", e);
            None
        }
    };

    let mut cfg = config::load_config().map_err(|e| e.to_string())?;
    cfg.last_opened_repo = Some(path.to_string());
    config::add_recent_repo(&mut cfg, path, &name);

    let ctx = RepoContext {
        backend,
        watcher: watcher_box,
        path: path.to_string(),
        name,
    };

    {
        let mut tabs = state
            .tabs
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;
        tabs.insert(tab_id.to_string(), ctx);
    }

    {
        let mut active = state
            .active_tab
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;
        *active = Some(tab_id.to_string());
    }
    config::save_config(&cfg).map_err(|e| e.to_string())?;

    let _ = app_handle.emit("repo:changed", tab_id.to_string());

    Ok(())
}

#[tauri::command]
pub fn open_repository(
    path: String,
    tab_id: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let backend = GitDispatcher::open_default(&path).map_err(|e| e.to_string())?;
    setup_repo_after_open(backend, &app_handle, &state, &path, &tab_id)
}

#[tauri::command]
pub fn init_repository(
    path: String,
    gitignore_template: Option<String>,
    tab_id: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let backend = GitDispatcher::init(&path).map_err(|e| e.to_string())?;

    if let Some(template_name) = gitignore_template {
        if !template_name.is_empty() {
            let content = crate::commands::gitignore::get_gitignore_template(template_name)?;
            let gitignore_path = std::path::Path::new(&path).join(".gitignore");
            std::fs::write(&gitignore_path, content)
                .map_err(|e| format!("Failed to write .gitignore: {e}"))?;
        }
    }

    setup_repo_after_open(backend, &app_handle, &state, &path, &tab_id)
}

#[tauri::command]
pub fn get_recent_repos() -> Result<Vec<RecentRepo>, String> {
    let cfg = config::load_config().map_err(|e| e.to_string())?;
    Ok(cfg.recent_repos)
}

#[tauri::command]
pub fn remove_recent_repo(path: String) -> Result<(), String> {
    let mut cfg = config::load_config().map_err(|e| e.to_string())?;
    config::remove_recent_repo(&mut cfg, &path);
    config::save_config(&cfg).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clone_repository(
    url: String,
    path: String,
    tab_id: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let backend = GitDispatcher::clone_repo(&url, &path).map_err(|e| e.to_string())?;
    setup_repo_after_open(backend, &app_handle, &state, &path, &tab_id)
}
