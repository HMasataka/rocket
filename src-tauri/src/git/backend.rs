use std::path::Path;

use crate::git::error::GitResult;
use crate::git::types::{CommitResult, DiffOptions, FileDiff, RepoStatus};

pub trait GitBackend: Send + Sync {
    fn status(&self) -> GitResult<RepoStatus>;
    fn diff(&self, path: Option<&Path>, options: &DiffOptions) -> GitResult<Vec<FileDiff>>;
    fn stage(&self, path: &Path) -> GitResult<()>;
    fn unstage(&self, path: &Path) -> GitResult<()>;
    fn stage_all(&self) -> GitResult<()>;
    fn unstage_all(&self) -> GitResult<()>;
    fn current_branch(&self) -> GitResult<String>;
    fn commit(&self, message: &str) -> GitResult<CommitResult>;
}
