use std::sync::Mutex;

use crate::git::backend::GitBackend;

pub struct AppState {
    pub repo: Mutex<Option<Box<dyn GitBackend>>>,
}
