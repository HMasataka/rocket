use std::path::Path;

use crate::git::backend::GitBackend;
use crate::git::error::{GitError, GitResult};
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

    pub fn init(path: impl AsRef<Path>) -> GitResult<Box<dyn GitBackend>> {
        let path = path.as_ref();
        git2::Repository::init(path)
            .map_err(|e| GitError::InitFailed(Box::new(e)))?;
        Self::open_default(path)
    }

    pub fn clone_repo(url: &str, path: impl AsRef<Path>) -> GitResult<Box<dyn GitBackend>> {
        let path = path.as_ref();
        let output = std::process::Command::new("git")
            .args(["clone", url, &path.to_string_lossy()])
            .output()
            .map_err(|e| GitError::CloneFailed(Box::new(e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(GitError::CloneFailed(stderr.into()));
        }

        Self::open_default(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn init_creates_repository() {
        let dir = tempfile::tempdir().unwrap();
        let backend = GitDispatcher::init(dir.path()).unwrap();
        assert!(backend.workdir().exists());
        assert!(dir.path().join(".git").exists());
    }

    #[test]
    fn init_returns_error_for_invalid_path() {
        let result = GitDispatcher::init("/nonexistent/deeply/nested/path/that/should/fail");
        assert!(result.is_err());
    }

    #[test]
    fn open_default_on_initialized_repo() {
        let dir = tempfile::tempdir().unwrap();
        let canonical = std::fs::canonicalize(dir.path()).unwrap();
        git2::Repository::init(&canonical).unwrap();
        let backend = GitDispatcher::open_default(&canonical).unwrap();
        // Canonicalize both to handle macOS /private symlink
        let expected = std::fs::canonicalize(canonical).unwrap();
        let actual = std::fs::canonicalize(backend.workdir()).unwrap();
        assert_eq!(actual, expected);
    }

    #[test]
    fn open_default_fails_for_non_repo() {
        let dir = tempfile::tempdir().unwrap();
        let result = GitDispatcher::open_default(dir.path());
        assert!(result.is_err());
    }
}
