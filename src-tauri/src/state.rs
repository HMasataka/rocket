use std::sync::Mutex;

use crate::git::backend::GitBackend;

pub struct AppState {
    pub repo: Mutex<Option<Box<dyn GitBackend>>>,
    pub watcher: Mutex<Option<Box<dyn std::any::Any + Send>>>,
}
