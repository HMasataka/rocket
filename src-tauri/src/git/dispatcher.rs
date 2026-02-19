use std::path::Path;

use crate::git::backend::GitBackend;
use crate::git::error::GitResult;
use crate::git::git2_backend::Git2Backend;

#[derive(Debug, Clone, Copy, Default)]
pub enum BackendKind {
    #[default]
    Git2,
}

pub struct GitDispatcher;

impl GitDispatcher {
    pub fn open(path: impl AsRef<Path>, kind: BackendKind) -> GitResult<Box<dyn GitBackend>> {
        match kind {
            BackendKind::Git2 => Ok(Box::new(Git2Backend::open(path)?)),
        }
    }

    pub fn open_default(path: impl AsRef<Path>) -> GitResult<Box<dyn GitBackend>> {
        Self::open(path, BackendKind::default())
    }
}
