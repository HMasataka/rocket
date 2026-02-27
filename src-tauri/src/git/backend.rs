use std::path::Path;

use crate::git::error::GitResult;
use crate::git::types::{
    BlameResult, BranchInfo, CherryPickMode, CherryPickResult, CommitDetail, CommitInfo,
    CommitLogResult, CommitResult, ConflictFile, ConflictResolution, DiffOptions, FetchResult,
    FileDiff, HunkIdentifier, LineRange, LogFilter, MergeBaseContent, MergeOption, MergeResult,
    PullOption, PushResult, RebaseResult, RebaseState, RebaseTodoEntry, ReflogEntry, RemoteInfo,
    RepoStatus, ResetMode, ResetResult, RevertMode, RevertResult, StashEntry, TagInfo,
};

pub trait GitBackend: Send + Sync {
    fn workdir(&self) -> &Path;
    fn status(&self) -> GitResult<RepoStatus>;
    fn diff(&self, path: Option<&Path>, options: &DiffOptions) -> GitResult<Vec<FileDiff>>;
    fn stage(&self, path: &Path) -> GitResult<()>;
    fn unstage(&self, path: &Path) -> GitResult<()>;
    fn stage_all(&self) -> GitResult<()>;
    fn unstage_all(&self) -> GitResult<()>;
    fn current_branch(&self) -> GitResult<String>;
    fn commit(&self, message: &str, amend: bool) -> GitResult<CommitResult>;
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
    fn stage_lines(&self, path: &Path, line_range: &LineRange) -> GitResult<()>;
    fn unstage_lines(&self, path: &Path, line_range: &LineRange) -> GitResult<()>;
    fn discard_lines(&self, path: &Path, line_range: &LineRange) -> GitResult<()>;
    fn get_head_commit_message(&self) -> GitResult<String>;

    // Stash operations
    fn stash_save(&self, message: Option<&str>) -> GitResult<()>;
    fn stash_list(&self) -> GitResult<Vec<StashEntry>>;
    fn stash_apply(&self, index: usize) -> GitResult<()>;
    fn stash_pop(&self, index: usize) -> GitResult<()>;
    fn stash_drop(&self, index: usize) -> GitResult<()>;
    fn stash_diff(&self, index: usize) -> GitResult<Vec<FileDiff>>;

    // Tag operations
    fn list_tags(&self) -> GitResult<Vec<TagInfo>>;
    fn create_tag(&self, name: &str, message: Option<&str>) -> GitResult<()>;
    fn delete_tag(&self, name: &str) -> GitResult<()>;
    fn checkout_tag(&self, name: &str) -> GitResult<()>;

    // Conflict operations
    fn get_conflict_files(&self) -> GitResult<Vec<ConflictFile>>;
    fn resolve_conflict(&self, path: &str, resolution: ConflictResolution) -> GitResult<()>;
    fn resolve_conflict_block(
        &self,
        path: &str,
        block_index: usize,
        resolution: ConflictResolution,
    ) -> GitResult<()>;
    fn mark_resolved(&self, path: &str) -> GitResult<()>;
    fn abort_merge(&self) -> GitResult<()>;
    fn continue_merge(&self, message: &str) -> GitResult<CommitResult>;
    fn is_merging(&self) -> GitResult<bool>;

    // Rebase operations
    fn rebase(&self, onto: &str) -> GitResult<RebaseResult>;
    fn interactive_rebase(&self, onto: &str, todo: &[RebaseTodoEntry]) -> GitResult<RebaseResult>;
    fn is_rebasing(&self) -> GitResult<bool>;
    fn abort_rebase(&self) -> GitResult<()>;
    fn continue_rebase(&self) -> GitResult<RebaseResult>;
    fn get_rebase_state(&self) -> GitResult<Option<RebaseState>>;
    fn get_rebase_todo(&self, onto: &str, limit: usize) -> GitResult<Vec<RebaseTodoEntry>>;
    fn get_merge_base_content(&self, path: &str) -> GitResult<MergeBaseContent>;

    // Cherry-pick operations
    fn cherry_pick(&self, oids: &[&str], mode: CherryPickMode) -> GitResult<CherryPickResult>;
    fn is_cherry_picking(&self) -> GitResult<bool>;
    fn abort_cherry_pick(&self) -> GitResult<()>;
    fn continue_cherry_pick(&self) -> GitResult<CherryPickResult>;

    // Revert operations
    fn revert(&self, oid: &str, mode: RevertMode) -> GitResult<RevertResult>;
    fn is_reverting(&self) -> GitResult<bool>;
    fn abort_revert(&self) -> GitResult<()>;
    fn continue_revert(&self) -> GitResult<RevertResult>;

    // Reset operations
    fn reset(&self, oid: &str, mode: ResetMode) -> GitResult<ResetResult>;
    fn reset_file(&self, path: &str, oid: &str) -> GitResult<()>;

    // Reflog operations
    fn get_reflog(&self, ref_name: &str, limit: usize) -> GitResult<Vec<ReflogEntry>>;
}
