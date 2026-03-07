use tauri::State;
use tauri_plugin_opener::OpenerExt;

use crate::commands::with_repo;
use crate::hosting::detector;
use crate::hosting::github;
use crate::hosting::types::{HostingInfo, Issue, PrDetail, PullRequest};
use crate::state::AppState;

fn get_repo_path(state: &State<'_, AppState>, tab_id: &str) -> Result<String, String> {
    with_repo(state, tab_id, |backend| {
        Ok(backend.workdir().to_string_lossy().to_string())
    })
}

#[tauri::command]
pub fn detect_hosting_provider(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<HostingInfo, String> {
    with_repo(&state, &tab_id, |backend| {
        let remotes = backend.list_remotes().map_err(|e| e.to_string())?;
        let remote = remotes.first().ok_or("No remotes found")?;
        Ok(detector::detect_from_remote_url(&remote.url))
    })
}

#[tauri::command]
pub fn list_pull_requests(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<PullRequest>, String> {
    let repo_path = get_repo_path(&state, &tab_id)?;
    github::list_pull_requests(&repo_path)
}

#[tauri::command]
pub fn get_pull_request_detail(
    tab_id: String,
    state: State<'_, AppState>,
    number: u64,
) -> Result<PrDetail, String> {
    let repo_path = get_repo_path(&state, &tab_id)?;
    github::get_pull_request_detail(&repo_path, number)
}

#[tauri::command]
pub fn list_issues(tab_id: String, state: State<'_, AppState>) -> Result<Vec<Issue>, String> {
    let repo_path = get_repo_path(&state, &tab_id)?;
    github::list_issues(&repo_path)
}

#[tauri::command]
pub fn get_default_branch(tab_id: String, state: State<'_, AppState>) -> Result<String, String> {
    let repo_path = get_repo_path(&state, &tab_id)?;
    github::get_default_branch(&repo_path)
}

#[tauri::command]
pub fn create_pull_request_url(
    tab_id: String,
    state: State<'_, AppState>,
    head: String,
    base: String,
) -> Result<String, String> {
    let repo_path = get_repo_path(&state, &tab_id)?;
    github::create_pull_request_url(&repo_path, &head, &base)
}

#[tauri::command]
pub fn open_in_browser(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("failed to open browser: {e}"))
}
