use std::path::Path;
use std::time::Duration;

use notify_debouncer_mini::new_debouncer;
use tauri::{AppHandle, Emitter};

pub fn start_watcher(
    app_handle: AppHandle,
    repo_path: &Path,
) -> Result<Box<dyn std::any::Any + Send>, Box<dyn std::error::Error>> {
    let handle = app_handle.clone();

    let mut debouncer = new_debouncer(
        Duration::from_millis(500),
        move |res: Result<Vec<notify_debouncer_mini::DebouncedEvent>, notify::Error>| {
            if res.is_ok() {
                let _ = handle.emit("repo:changed", ());
            }
        },
    )?;

    debouncer
        .watcher()
        .watch(repo_path, notify::RecursiveMode::Recursive)?;

    Ok(Box::new(debouncer))
}
