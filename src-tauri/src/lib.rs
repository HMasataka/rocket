mod commands;
mod config;
pub mod git;
mod state;

use std::sync::Mutex;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let repo = std::env::current_dir()
        .ok()
        .and_then(|cwd| {
            git::dispatcher::GitDispatcher::open_default(&cwd)
                .ok()
        });

    tauri::Builder::default()
        .manage(AppState {
            repo: Mutex::new(repo),
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
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
            commands::config::get_config,
            commands::config::save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
