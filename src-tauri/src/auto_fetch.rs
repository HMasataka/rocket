use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
pub struct AutoFetchUpdate {
    pub tab_id: String,
    pub remote_name: String,
    pub new_commits_count: u32,
}

pub struct AutoFetchHandle {
    stop_flag: Arc<AtomicBool>,
}

impl AutoFetchHandle {
    pub fn stop(&self) {
        self.stop_flag.store(true, Ordering::Relaxed);
    }
}

impl Drop for AutoFetchHandle {
    fn drop(&mut self) {
        self.stop();
    }
}

pub fn start_auto_fetch(app_handle: AppHandle, interval_secs: u64) -> AutoFetchHandle {
    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_flag_clone = Arc::clone(&stop_flag);

    std::thread::spawn(move || {
        loop {
            for _ in 0..interval_secs {
                if stop_flag_clone.load(Ordering::Relaxed) {
                    return;
                }
                std::thread::sleep(Duration::from_secs(1));
            }

            if stop_flag_clone.load(Ordering::Relaxed) {
                return;
            }

            let state: tauri::State<'_, AppState> = match app_handle.try_state::<AppState>() {
                Some(s) => s,
                None => continue,
            };

            // Collect tab info while holding the lock briefly
            let tab_entries: Vec<(String, Vec<String>)> = {
                let tabs = match state.tabs.try_lock() {
                    Ok(t) => t,
                    Err(_) => continue,
                };

                tabs.iter()
                    .filter_map(|(tab_id, ctx)| {
                        let remotes = ctx.backend.list_remotes().ok()?;
                        let remote_names: Vec<String> =
                            remotes.iter().map(|r| r.name.clone()).collect();
                        if remote_names.is_empty() {
                            None
                        } else {
                            Some((tab_id.clone(), remote_names))
                        }
                    })
                    .collect()
            };

            for (tab_id, remote_names) in &tab_entries {
                for remote_name in remote_names {
                    if stop_flag_clone.load(Ordering::Relaxed) {
                        return;
                    }

                    // Snapshot branches before fetch and extract repo path (short lock)
                    let (branches_before, repo_path) = {
                        let tabs = match state.tabs.try_lock() {
                            Ok(t) => t,
                            Err(_) => continue,
                        };
                        match tabs.get(tab_id) {
                            Some(ctx) => (
                                ctx.backend.list_branches().unwrap_or_default(),
                                ctx.backend.workdir().to_path_buf(),
                            ),
                            None => continue,
                        }
                    };

                    // Execute fetch outside of lock via git CLI to avoid holding
                    // MutexGuard during network I/O
                    {
                        let output = std::process::Command::new("git")
                            .args(["fetch", remote_name])
                            .current_dir(&repo_path)
                            .stdout(std::process::Stdio::null())
                            .stderr(std::process::Stdio::null())
                            .status();
                        match output {
                            Ok(status) if status.success() => {}
                            _ => continue,
                        }
                    }

                    // Snapshot branches after fetch (short lock)
                    let branches_after = {
                        let tabs = match state.tabs.try_lock() {
                            Ok(t) => t,
                            Err(_) => continue,
                        };
                        match tabs.get(tab_id) {
                            Some(ctx) => ctx.backend.list_branches().unwrap_or_default(),
                            None => continue,
                        }
                    };

                    // Compare outside of any lock
                    let mut new_commits: u32 = 0;
                    for after_branch in &branches_after {
                        if let Some(before_branch) =
                            branches_before.iter().find(|b| b.name == after_branch.name)
                        {
                            if after_branch.behind_count > before_branch.behind_count {
                                new_commits +=
                                    after_branch.behind_count - before_branch.behind_count;
                            }
                        }
                    }

                    if new_commits > 0 {
                        let update = AutoFetchUpdate {
                            tab_id: tab_id.clone(),
                            remote_name: remote_name.clone(),
                            new_commits_count: new_commits,
                        };
                        let _ = app_handle.emit("auto-fetch:updated", &update);
                    }
                }
            }
        }
    });

    AutoFetchHandle { stop_flag }
}
