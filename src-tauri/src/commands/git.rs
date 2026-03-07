use std::path::Path;

use tauri::State;

use crate::commands::with_repo;
use crate::git::types::{
    CommitResult, DiffOptions, FileDiff, HunkIdentifier, LineRange, RepoStatus,
};
use crate::state::AppState;

#[tauri::command]
pub fn get_status(tab_id: String, state: State<'_, AppState>) -> Result<RepoStatus, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.status().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_diff(
    tab_id: String,
    path: Option<String>,
    staged: bool,
    state: State<'_, AppState>,
) -> Result<Vec<FileDiff>, String> {
    with_repo(&state, &tab_id, |backend| {
        let options = DiffOptions {
            staged,
            ..Default::default()
        };
        let path_buf = path.map(std::path::PathBuf::from);
        backend
            .diff(path_buf.as_deref(), &options)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn stage_file(tab_id: String, path: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.stage(Path::new(&path)).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn unstage_file(
    tab_id: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.unstage(Path::new(&path)).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn stage_all(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.stage_all().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn unstage_all(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend.unstage_all().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn commit(
    tab_id: String,
    message: String,
    amend: bool,
    sign: bool,
    state: State<'_, AppState>,
) -> Result<CommitResult, String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .commit(&message, amend, sign)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_current_branch(tab_id: String, state: State<'_, AppState>) -> Result<String, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.current_branch().map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn stage_hunk(
    tab_id: String,
    path: String,
    hunk: HunkIdentifier,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .stage_hunk(Path::new(&path), &hunk)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn unstage_hunk(
    tab_id: String,
    path: String,
    hunk: HunkIdentifier,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .unstage_hunk(Path::new(&path), &hunk)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn discard_hunk(
    tab_id: String,
    path: String,
    hunk: HunkIdentifier,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .discard_hunk(Path::new(&path), &hunk)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn stage_lines(
    tab_id: String,
    path: String,
    line_range: LineRange,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .stage_lines(Path::new(&path), &line_range)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn unstage_lines(
    tab_id: String,
    path: String,
    line_range: LineRange,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .unstage_lines(Path::new(&path), &line_range)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn discard_lines(
    tab_id: String,
    path: String,
    line_range: LineRange,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_repo(&state, &tab_id, |backend| {
        backend
            .discard_lines(Path::new(&path), &line_range)
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_head_commit_message(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    with_repo(&state, &tab_id, |backend| {
        backend.get_head_commit_message().map_err(|e| e.to_string())
    })
}
