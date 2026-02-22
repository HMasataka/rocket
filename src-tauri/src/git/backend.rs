use std::path::Path;

use crate::git::error::GitResult;
use crate::git::types::{BranchInfo, CommitResult, DiffOptions, FileDiff, MergeOption, MergeResult, RepoStatus};

pub trait GitBackend: Send + Sync {
    fn status(&self) -> GitResult<RepoStatus>;
    fn diff(&self, path: Option<&Path>, options: &DiffOptions) -> GitResult<Vec<FileDiff>>;
    fn stage(&self, path: &Path) -> GitResult<()>;
    fn unstage(&self, path: &Path) -> GitResult<()>;
    fn stage_all(&self) -> GitResult<()>;
    fn unstage_all(&self) -> GitResult<()>;
    fn current_branch(&self) -> GitResult<String>;
    fn commit(&self, message: &str) -> GitResult<CommitResult>;
    fn list_branches(&self) -> GitResult<Vec<BranchInfo>>;
    fn create_branch(&self, name: &str) -> GitResult<()>;
    fn checkout_branch(&self, name: &str) -> GitResult<()>;
    fn delete_branch(&self, name: &str) -> GitResult<()>;
    fn rename_branch(&self, old_name: &str, new_name: &str) -> GitResult<()>;
    fn merge_branch(&self, branch_name: &str, option: MergeOption) -> GitResult<MergeResult>;
}
