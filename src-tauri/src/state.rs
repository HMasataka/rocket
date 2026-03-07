use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;

use crate::git::backend::GitBackend;

pub const DEFAULT_TAB_ID: &str = "default";

pub type TabId = String;

pub struct RepoContext {
    pub backend: Box<dyn GitBackend>,
    pub watcher: Option<Box<dyn std::any::Any + Send>>,
    pub path: String,
    pub name: String,
}

pub struct AppState {
    pub tabs: Mutex<HashMap<TabId, RepoContext>>,
    pub active_tab: Mutex<Option<TabId>>,
    pub auto_fetch_handle: Mutex<Option<Box<dyn std::any::Any + Send>>>,
}

pub fn repo_name_from_path(path: &str) -> String {
    Path::new(path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string())
}
