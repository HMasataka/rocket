use std::path::Path;

use crate::git::error::GitResult;
use crate::git::types::{
    BlameResult, BranchInfo, CommitDetail, CommitInfo, CommitLogResult, CommitResult, DiffOptions,
    FetchResult, FileDiff, HunkIdentifier, LogFilter, MergeOption, MergeResult, PullOption,
    PushResult, RemoteInfo, RepoStatus,
};

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
    fn fetch(&self, remote_name: &str) -> GitResult<FetchResult>;
    fn pull(&self, remote_name: &str, option: PullOption) -> GitResult<MergeResult>;
    fn push(&self, remote_name: &str) -> GitResult<PushResult>;
    fn list_remotes(&self) -> GitResult<Vec<RemoteInfo>>;
    fn add_remote(&self, name: &str, url: &str) -> GitResult<()>;
    fn remove_remote(&self, name: &str) -> GitResult<()>;
    fn edit_remote(&self, name: &str, new_url: &str) -> GitResult<()>;
    fn get_commit_log(
        &self,
        filter: &LogFilter,
        limit: usize,
        skip: usize,
    ) -> GitResult<CommitLogResult>;
    fn get_commit_detail(&self, oid: &str) -> GitResult<CommitDetail>;
    fn get_commit_file_diff(&self, oid: &str, path: &str) -> GitResult<Vec<FileDiff>>;
    fn get_blame(&self, path: &str, commit_oid: Option<&str>) -> GitResult<BlameResult>;
    fn get_file_history(&self, path: &str, limit: usize, skip: usize)
        -> GitResult<Vec<CommitInfo>>;
    fn get_branch_commits(&self, branch_name: &str, limit: usize) -> GitResult<Vec<CommitInfo>>;
    fn stage_hunk(&self, path: &Path, hunk: &HunkIdentifier) -> GitResult<()>;
    fn unstage_hunk(&self, path: &Path, hunk: &HunkIdentifier) -> GitResult<()>;
    fn discard_hunk(&self, path: &Path, hunk: &HunkIdentifier) -> GitResult<()>;
}
