use tauri::State;

use crate::commands::with_repo;
use crate::git::search::{CodeSearchResult, CommitSearchResult, FilenameSearchResult};
use crate::state::AppState;

#[tauri::command]
pub fn search_code(
    tab_id: String,
    query: String,
    is_regex: bool,
    state: State<'_, AppState>,
) -> Result<Vec<CodeSearchResult>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .search_code(&query, is_regex)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn search_commits(
    tab_id: String,
    query: String,
    search_diff: bool,
    state: State<'_, AppState>,
) -> Result<Vec<CommitSearchResult>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .search_commits(&query, search_diff)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn search_filenames(
    tab_id: String,
    query: String,
    state: State<'_, AppState>,
) -> Result<Vec<FilenameSearchResult>, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.search_filenames(&query).map_err(|e| e.to_string())
    })
}
