pub mod commands;
mod config;
pub mod git;
pub mod state;
mod watcher;

use std::sync::Mutex;

use state::AppState;
use tauri::Manager;

/// CLI 引数 → last_opened_repo → カレントディレクトリ の優先順位でリポジトリパスを解決する
fn resolve_repo_path() -> Option<std::path::PathBuf> {
    // 1. CLI 引数にパスが指定されている場合
    if let Some(arg) = std::env::args().nth(1) {
        return std::fs::canonicalize(&arg).ok();
    }

    // 2. last_opened_repo が設定されている場合
    if let Ok(cfg) = config::load_config() {
        if let Some(last) = cfg.last_opened_repo {
            let path = std::path::PathBuf::from(&last);
            if path.is_dir() {
                return Some(path);
            }
        }
    }

    // 3. カレントディレクトリ
    std::env::current_dir().ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let repo_path = resolve_repo_path();
    let repo = repo_path
        .as_ref()
        .and_then(|path| git::dispatcher::GitDispatcher::open_default(path).ok());

    // リポジトリを正常に開けた場合、last_opened_repo に保存
    if let (Some(path), Some(_)) = (&repo_path, &repo) {
        if let Ok(mut cfg) = config::load_config() {
            cfg.last_opened_repo = Some(path.to_string_lossy().to_string());
            let _ = config::save_config(&cfg);
        }
    }

    // git2::Repository::discover で実際の workdir を解決する
    let watch_path = repo_path.as_ref().and_then(|path| {
        git2::Repository::discover(path)
            .ok()
            .and_then(|repo| repo.workdir().map(|p| p.to_path_buf()))
    });

    tauri::Builder::default()
        .manage(AppState {
            repo: Mutex::new(repo),
            watcher: Mutex::new(None),
        })
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            if let Some(path) = watch_path {
                match watcher::start_watcher(app.handle().clone(), &path) {
                    Ok(w) => {
                        let state = app.state::<AppState>();
                        *state.watcher.lock().unwrap() = Some(w);
                    }
                    Err(e) => {
                        log::error!("ファイル監視の起動に失敗: {}", e);
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::git::get_status,
            commands::git::get_diff,
            commands::git::stage_file,
            commands::git::unstage_file,
            commands::git::stage_all,
            commands::git::unstage_all,
            commands::git::commit,
            commands::git::get_current_branch,
            commands::git::stage_hunk,
            commands::git::unstage_hunk,
            commands::git::discard_hunk,
            commands::git::stage_lines,
            commands::git::unstage_lines,
            commands::git::discard_lines,
            commands::git::get_head_commit_message,
            commands::config::get_config,
            commands::config::save_config,
            commands::branch::list_branches,
            commands::branch::create_branch,
            commands::branch::checkout_branch,
            commands::branch::delete_branch,
            commands::branch::rename_branch,
            commands::branch::merge_branch,
            commands::branch::get_branch_commits,
            commands::remote::fetch_remote,
            commands::remote::pull_remote,
            commands::remote::push_remote,
            commands::remote::list_remotes,
            commands::remote::add_remote,
            commands::remote::remove_remote,
            commands::remote::edit_remote,
            commands::history::get_commit_log,
            commands::history::get_commit_detail,
            commands::history::get_commit_file_diff,
            commands::history::get_blame,
            commands::history::get_file_history,
            commands::stash::stash_save,
            commands::stash::list_stashes,
            commands::stash::apply_stash,
            commands::stash::pop_stash,
            commands::stash::drop_stash,
            commands::stash::get_stash_diff,
            commands::tag::list_tags,
            commands::tag::create_tag,
            commands::tag::delete_tag,
            commands::tag::checkout_tag,
            commands::conflict::get_conflict_files,
            commands::conflict::resolve_conflict,
            commands::conflict::resolve_conflict_block,
            commands::conflict::mark_resolved,
            commands::conflict::abort_merge,
            commands::conflict::continue_merge,
            commands::conflict::is_merging,
            commands::rebase::rebase,
            commands::rebase::interactive_rebase,
            commands::rebase::is_rebasing,
            commands::rebase::abort_rebase,
            commands::rebase::continue_rebase,
            commands::rebase::get_rebase_state,
            commands::rebase::get_rebase_todo,
            commands::rebase::get_merge_base_content,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
