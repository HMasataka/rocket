use std::path::{Path, PathBuf};
use std::sync::Mutex;

use git2::{
    BranchType, DiffFormat, DiffOptions as Git2DiffOptions, Oid, Repository, Sort, StatusOptions,
};

use crate::git::auth::create_credentials_callback;
use crate::git::backend::GitBackend;
use crate::git::error::{GitError, GitResult};
use crate::git::types::{
    BlameLine, BlameResult, BranchInfo, CommitDetail, CommitFileChange, CommitFileStatus,
    CommitGraphRow, CommitInfo, CommitLogResult, CommitRef, CommitRefKind, CommitResult,
    CommitStats, ConflictBlock, ConflictFile, ConflictResolution, DiffHunk, DiffLine, DiffLineKind,
    DiffOptions, FetchResult, FileDiff, FileStatus, FileStatusKind, GraphEdge, GraphNodeType,
    HunkIdentifier, LineRange, LogFilter, MergeBaseContent, MergeKind, MergeOption, MergeResult,
    PullOption, PushResult, RebaseAction, RebaseResult, RebaseState, RebaseTodoEntry, RemoteInfo,
    RepoStatus, StagingState, StashEntry, TagInfo, WordSegment,
};

pub struct Git2Backend {
    repo: Mutex<Repository>,
    workdir: PathBuf,
}

impl Git2Backend {
    pub fn open(path: impl AsRef<Path>) -> GitResult<Self> {
        let path = path.as_ref();
        let repo = Repository::discover(path).map_err(|e| {
            if e.code() == git2::ErrorCode::NotFound {
                GitError::RepositoryNotFound {
                    path: path.display().to_string(),
                }
            } else {
                GitError::OpenFailed(Box::new(e))
            }
        })?;

        let workdir = repo
            .workdir()
            .ok_or_else(|| GitError::OpenFailed("bare repository".into()))?
            .to_path_buf();

        Ok(Self {
            repo: Mutex::new(repo),
            workdir,
        })
    }
}

impl GitBackend for Git2Backend {
    fn status(&self) -> GitResult<RepoStatus> {
        let repo = self.repo.lock().unwrap();

        let mut opts = StatusOptions::new();
        opts.include_untracked(true)
            .recurse_untracked_dirs(true)
            .include_unmodified(false);

        let statuses = repo
            .statuses(Some(&mut opts))
            .map_err(|e| GitError::StatusFailed(Box::new(e)))?;

        let mut files = Vec::new();

        for entry in statuses.iter() {
            let path = entry.path().unwrap_or("").to_string();
            let status = entry.status();

            if status.contains(git2::Status::CONFLICTED) {
                files.push(FileStatus {
                    path,
                    kind: FileStatusKind::Conflicted,
                    staging: StagingState::Unstaged,
                });
                continue;
            }

            // Index (staged) changes
            if status.intersects(
                git2::Status::INDEX_NEW
                    | git2::Status::INDEX_MODIFIED
                    | git2::Status::INDEX_DELETED
                    | git2::Status::INDEX_RENAMED
                    | git2::Status::INDEX_TYPECHANGE,
            ) {
                let kind = index_status_to_kind(status);
                files.push(FileStatus {
                    path: path.clone(),
                    kind,
                    staging: StagingState::Staged,
                });
            }

            // Workdir (unstaged) changes
            if status.intersects(
                git2::Status::WT_NEW
                    | git2::Status::WT_MODIFIED
                    | git2::Status::WT_DELETED
                    | git2::Status::WT_RENAMED
                    | git2::Status::WT_TYPECHANGE,
            ) {
                let kind = wt_status_to_kind(status);
                files.push(FileStatus {
                    path,
                    kind,
                    staging: StagingState::Unstaged,
                });
            }
        }

        Ok(RepoStatus { files })
    }

    fn diff(&self, path: Option<&Path>, options: &DiffOptions) -> GitResult<Vec<FileDiff>> {
        let repo = self.repo.lock().unwrap();

        let mut diff_opts = Git2DiffOptions::new();
        diff_opts.context_lines(options.context_lines);

        if let Some(p) = path {
            diff_opts.pathspec(p);
        }

        let diff = if options.staged {
            // staged: diff between HEAD tree and index
            let head_tree = repo.head().ok().and_then(|r| r.peel_to_tree().ok());

            repo.diff_tree_to_index(head_tree.as_ref(), None, Some(&mut diff_opts))
                .map_err(|e| GitError::DiffFailed(Box::new(e)))?
        } else {
            // unstaged: diff between index and workdir
            repo.diff_index_to_workdir(None, Some(&mut diff_opts))
                .map_err(|e| GitError::DiffFailed(Box::new(e)))?
        };

        let mut file_diffs =
            parse_diff_to_file_diffs(&diff).map_err(|e| GitError::DiffFailed(Box::new(e)))?;

        compute_word_diffs(&mut file_diffs);

        Ok(file_diffs)
    }

    fn stage(&self, path: &Path) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let mut index = repo
            .index()
            .map_err(|e| GitError::StageFailed(Box::new(e)))?;

        // Handle deleted files: if the file doesn't exist on disk, remove from index
        let full_path = self.workdir.join(path);
        if !full_path.exists() {
            index
                .remove_path(path)
                .map_err(|e| GitError::StageFailed(Box::new(e)))?;
        } else {
            index
                .add_path(path)
                .map_err(|e| GitError::StageFailed(Box::new(e)))?;
        }

        index
            .write()
            .map_err(|e| GitError::StageFailed(Box::new(e)))?;

        Ok(())
    }

    fn unstage(&self, path: &Path) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();

        match repo.head() {
            Ok(head) => {
                // HEAD exists: reset the path in the index to match HEAD
                let obj = head
                    .peel(git2::ObjectType::Commit)
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
                repo.reset_default(Some(&obj), [path])
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
            }
            Err(_) => {
                // No HEAD (initial commit): remove the path from the index
                let mut index = repo
                    .index()
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
                index
                    .remove_path(path)
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
                index
                    .write()
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
            }
        }

        Ok(())
    }

    fn stage_all(&self) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let mut index = repo
            .index()
            .map_err(|e| GitError::StageFailed(Box::new(e)))?;

        index
            .add_all(["*"], git2::IndexAddOption::DEFAULT, None)
            .map_err(|e| GitError::StageFailed(Box::new(e)))?;

        index
            .write()
            .map_err(|e| GitError::StageFailed(Box::new(e)))?;

        Ok(())
    }

    fn unstage_all(&self) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();

        match repo.head() {
            Ok(head) => {
                let obj = head
                    .peel(git2::ObjectType::Commit)
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
                repo.reset_default(Some(&obj), ["*"])
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
            }
            Err(_) => {
                // No HEAD (initial commit): clear the entire index
                let mut index = repo
                    .index()
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
                index
                    .clear()
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
                index
                    .write()
                    .map_err(|e| GitError::UnstageFailed(Box::new(e)))?;
            }
        }

        Ok(())
    }

    fn current_branch(&self) -> GitResult<String> {
        let repo = self.repo.lock().unwrap();
        let head = repo
            .head()
            .map_err(|e| GitError::BranchNotFound(Box::new(e)))?;

        let name = head.shorthand().unwrap_or("HEAD").to_string();
        Ok(name)
    }

    fn commit(&self, message: &str, amend: bool) -> GitResult<CommitResult> {
        let repo = self.repo.lock().unwrap();

        let mut index = repo
            .index()
            .map_err(|e| GitError::CommitFailed(Box::new(e)))?;

        let tree_oid = index
            .write_tree()
            .map_err(|e| GitError::CommitFailed(Box::new(e)))?;

        let tree = repo
            .find_tree(tree_oid)
            .map_err(|e| GitError::CommitFailed(Box::new(e)))?;

        let sig = repo
            .signature()
            .map_err(|e| GitError::CommitFailed(Box::new(e)))?;

        if amend {
            let head = repo
                .head()
                .map_err(|e| GitError::AmendFailed(Box::new(e)))?;
            let head_commit = head
                .peel_to_commit()
                .map_err(|e| GitError::AmendFailed(Box::new(e)))?;

            let oid = head_commit
                .amend(
                    Some("HEAD"),
                    Some(&sig),
                    Some(&sig),
                    None,
                    Some(message),
                    Some(&tree),
                )
                .map_err(|e| GitError::AmendFailed(Box::new(e)))?;

            return Ok(CommitResult {
                oid: oid.to_string(),
            });
        }

        let parents: Vec<git2::Commit> = match repo.head() {
            Ok(head) => {
                let commit = head
                    .peel_to_commit()
                    .map_err(|e| GitError::CommitFailed(Box::new(e)))?;
                vec![commit]
            }
            Err(_) => vec![], // Initial commit — no parents
        };

        let parent_refs: Vec<&git2::Commit> = parents.iter().collect();

        let oid = repo
            .commit(Some("HEAD"), &sig, &sig, message, &tree, &parent_refs)
            .map_err(|e| GitError::CommitFailed(Box::new(e)))?;

        Ok(CommitResult {
            oid: oid.to_string(),
        })
    }

    fn list_branches(&self) -> GitResult<Vec<BranchInfo>> {
        let repo = self.repo.lock().unwrap();
        let branches = repo
            .branches(None)
            .map_err(|e| GitError::BranchListFailed(Box::new(e)))?;

        let mut result = Vec::new();
        for branch in branches {
            let (branch, branch_type) =
                branch.map_err(|e| GitError::BranchListFailed(Box::new(e)))?;
            let name = branch
                .name()
                .map_err(|e| GitError::BranchListFailed(Box::new(e)))?
                .unwrap_or("")
                .to_string();
            let is_head = branch.is_head();
            let is_remote = branch_type == BranchType::Remote;

            let remote_name = if is_remote {
                name.split('/').next().map(|s| s.to_string())
            } else {
                None
            };

            let upstream = branch
                .upstream()
                .ok()
                .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()));

            let (ahead_count, behind_count) = if !is_remote {
                branch
                    .get()
                    .target()
                    .and_then(|local_oid| {
                        branch
                            .upstream()
                            .ok()
                            .and_then(|u| u.get().target())
                            .and_then(|upstream_oid| {
                                repo.graph_ahead_behind(local_oid, upstream_oid).ok()
                            })
                    })
                    .unwrap_or((0, 0))
            } else {
                (0, 0)
            };

            result.push(BranchInfo {
                name,
                is_head,
                is_remote,
                remote_name,
                upstream,
                ahead_count: ahead_count as u32,
                behind_count: behind_count as u32,
            });
        }
        Ok(result)
    }

    fn create_branch(&self, name: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let head = repo
            .head()
            .map_err(|e| GitError::BranchCreateFailed(Box::new(e)))?;
        let commit = head
            .peel_to_commit()
            .map_err(|e| GitError::BranchCreateFailed(Box::new(e)))?;
        repo.branch(name, &commit, false)
            .map_err(|e| GitError::BranchCreateFailed(Box::new(e)))?;
        Ok(())
    }

    fn checkout_branch(&self, name: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        repo.set_head(&format!("refs/heads/{name}"))
            .map_err(|e| GitError::CheckoutFailed(Box::new(e)))?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
            .map_err(|e| GitError::CheckoutFailed(Box::new(e)))?;
        Ok(())
    }

    fn delete_branch(&self, name: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let mut branch = repo
            .find_branch(name, BranchType::Local)
            .map_err(|e| GitError::BranchDeleteFailed(Box::new(e)))?;
        branch
            .delete()
            .map_err(|e| GitError::BranchDeleteFailed(Box::new(e)))?;
        Ok(())
    }

    fn rename_branch(&self, old_name: &str, new_name: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let mut branch = repo
            .find_branch(old_name, BranchType::Local)
            .map_err(|e| GitError::BranchRenameFailed(Box::new(e)))?;
        branch
            .rename(new_name, false)
            .map_err(|e| GitError::BranchRenameFailed(Box::new(e)))?;
        Ok(())
    }

    fn merge_branch(&self, branch_name: &str, option: MergeOption) -> GitResult<MergeResult> {
        let repo = self.repo.lock().unwrap();

        let branch_ref = repo
            .find_branch(branch_name, BranchType::Local)
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;
        let target_oid = branch_ref
            .get()
            .target()
            .ok_or_else(|| GitError::MergeFailed("branch has no target".into()))?;
        let annotated = repo
            .find_annotated_commit(target_oid)
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        let (analysis, _) = repo
            .merge_analysis(&[&annotated])
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        if analysis.is_up_to_date() {
            return Ok(MergeResult {
                kind: MergeKind::UpToDate,
                oid: None,
                conflicts: vec![],
            });
        }

        if analysis.is_fast_forward() {
            if option == MergeOption::NoFastForward {
                return self.merge_normal_commit(&repo, branch_name, &annotated);
            }
            let head_ref = repo
                .head()
                .map_err(|e| GitError::MergeFailed(Box::new(e)))?;
            let head_name = head_ref
                .name()
                .ok_or_else(|| GitError::MergeFailed("HEAD has no name".into()))?
                .to_string();
            drop(head_ref);

            repo.reference(
                &head_name,
                target_oid,
                true,
                &format!("Fast-forward to {branch_name}"),
            )
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;
            repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
                .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

            return Ok(MergeResult {
                kind: MergeKind::FastForward,
                oid: Some(target_oid.to_string()),
                conflicts: vec![],
            });
        }

        if option == MergeOption::FastForwardOnly {
            return Err(GitError::MergeFailed("fast-forward not possible".into()));
        }

        self.merge_normal_commit(&repo, branch_name, &annotated)
    }

    fn fetch(&self, remote_name: &str) -> GitResult<FetchResult> {
        let repo = self.repo.lock().unwrap();
        let mut remote = repo
            .find_remote(remote_name)
            .map_err(|e| GitError::FetchFailed(Box::new(e)))?;

        let mut fetch_opts = git2::FetchOptions::new();
        let mut callbacks = git2::RemoteCallbacks::new();
        callbacks.credentials(create_credentials_callback());
        fetch_opts.remote_callbacks(callbacks);

        remote
            .fetch(&[] as &[&str], Some(&mut fetch_opts), None)
            .map_err(|e| GitError::FetchFailed(Box::new(e)))?;

        Ok(FetchResult {
            remote_name: remote_name.to_string(),
        })
    }

    fn pull(&self, remote_name: &str, option: PullOption) -> GitResult<MergeResult> {
        self.fetch(remote_name)?;

        let (remote_ref_name, target_oid, analysis) = {
            let repo = self.repo.lock().unwrap();
            let head = repo.head().map_err(|e| GitError::PullFailed(Box::new(e)))?;
            let branch_name = head
                .shorthand()
                .ok_or_else(|| GitError::PullFailed("HEAD has no name".into()))?
                .to_string();

            let remote_ref_name = format!("{remote_name}/{branch_name}");
            let remote_branch = repo
                .find_branch(&remote_ref_name, BranchType::Remote)
                .map_err(|e| GitError::PullFailed(Box::new(e)))?;
            let target_oid = remote_branch
                .get()
                .target()
                .ok_or_else(|| GitError::PullFailed("remote branch has no target".into()))?;
            let annotated = repo
                .find_annotated_commit(target_oid)
                .map_err(|e| GitError::PullFailed(Box::new(e)))?;

            let (analysis, _) = repo
                .merge_analysis(&[&annotated])
                .map_err(|e| GitError::PullFailed(Box::new(e)))?;

            (remote_ref_name, target_oid, analysis)
        };

        if analysis.is_up_to_date() {
            return Ok(MergeResult {
                kind: MergeKind::UpToDate,
                oid: None,
                conflicts: vec![],
            });
        }

        match option {
            PullOption::Merge => self.merge_after_fetch(&remote_ref_name, analysis, target_oid),
            PullOption::Rebase => self.rebase_after_fetch(target_oid),
        }
    }

    fn push(&self, remote_name: &str) -> GitResult<PushResult> {
        let repo = self.repo.lock().unwrap();
        let mut remote = repo
            .find_remote(remote_name)
            .map_err(|e| GitError::PushFailed(Box::new(e)))?;

        let head = repo.head().map_err(|e| GitError::PushFailed(Box::new(e)))?;
        let branch_name = head
            .shorthand()
            .ok_or_else(|| GitError::PushFailed("HEAD has no name".into()))?
            .to_string();

        let refspec = format!("refs/heads/{branch_name}:refs/heads/{branch_name}");

        let mut push_opts = git2::PushOptions::new();
        let mut callbacks = git2::RemoteCallbacks::new();
        callbacks.credentials(create_credentials_callback());
        push_opts.remote_callbacks(callbacks);

        remote
            .push(&[&refspec], Some(&mut push_opts))
            .map_err(|e| GitError::PushFailed(Box::new(e)))?;

        // upstream が未設定の場合は自動設定
        drop(head);
        if let Ok(mut local_branch) = repo.find_branch(&branch_name, BranchType::Local) {
            if local_branch.upstream().is_err() {
                let upstream_name = format!("{remote_name}/{branch_name}");
                let _ = local_branch.set_upstream(Some(&upstream_name));
            }
        }

        Ok(PushResult {
            remote_name: remote_name.to_string(),
            branch: branch_name,
        })
    }

    fn list_remotes(&self) -> GitResult<Vec<RemoteInfo>> {
        let repo = self.repo.lock().unwrap();
        let remote_names = repo
            .remotes()
            .map_err(|e| GitError::RemoteFailed(Box::new(e)))?;

        let mut remotes = Vec::new();
        for name in remote_names.iter().flatten() {
            let remote = repo
                .find_remote(name)
                .map_err(|e| GitError::RemoteFailed(Box::new(e)))?;
            let url = remote.url().unwrap_or("").to_string();
            remotes.push(RemoteInfo {
                name: name.to_string(),
                url,
            });
        }
        Ok(remotes)
    }

    fn add_remote(&self, name: &str, url: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        repo.remote(name, url)
            .map_err(|e| GitError::RemoteFailed(Box::new(e)))?;
        Ok(())
    }

    fn remove_remote(&self, name: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        repo.remote_delete(name)
            .map_err(|e| GitError::RemoteFailed(Box::new(e)))?;
        Ok(())
    }

    fn edit_remote(&self, name: &str, new_url: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        repo.remote_set_url(name, new_url)
            .map_err(|e| GitError::RemoteFailed(Box::new(e)))?;
        Ok(())
    }

    fn get_commit_log(
        &self,
        filter: &LogFilter,
        limit: usize,
        skip: usize,
    ) -> GitResult<CommitLogResult> {
        let repo = self.repo.lock().unwrap();

        let mut revwalk = repo
            .revwalk()
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        revwalk
            .set_sorting(Sort::TIME | Sort::TOPOLOGICAL)
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        revwalk
            .push_head()
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;

        let ref_map = build_ref_map(&repo);
        let mut commits = Vec::new();
        let mut skipped = 0;

        for oid_result in revwalk {
            let oid = oid_result.map_err(|e| GitError::LogFailed(Box::new(e)))?;
            let commit = repo
                .find_commit(oid)
                .map_err(|e| GitError::LogFailed(Box::new(e)))?;

            if !matches_filter(&repo, &commit, filter) {
                continue;
            }

            if skipped < skip {
                skipped += 1;
                continue;
            }

            let info = commit_to_info(&commit, &ref_map);
            commits.push(info);

            if commits.len() >= limit {
                break;
            }
        }

        let graph = build_graph(&commits);

        Ok(CommitLogResult { commits, graph })
    }

    fn get_commit_detail(&self, oid: &str) -> GitResult<CommitDetail> {
        let repo = self.repo.lock().unwrap();
        let commit_oid = Oid::from_str(oid).map_err(|_| GitError::CommitNotFound {
            oid: oid.to_string(),
        })?;
        let commit = repo
            .find_commit(commit_oid)
            .map_err(|_| GitError::CommitNotFound {
                oid: oid.to_string(),
            })?;

        let ref_map = build_ref_map(&repo);
        let info = commit_to_info(&commit, &ref_map);

        let commit_tree = commit
            .tree()
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        let parent_tree = commit.parent(0).ok().and_then(|p| p.tree().ok());

        let diff = repo
            .diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), None)
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;

        let diff_stats = diff.stats().map_err(|e| GitError::LogFailed(Box::new(e)))?;

        let mut files = Vec::new();
        for delta_idx in 0..diff.deltas().len() {
            let delta = diff.get_delta(delta_idx).unwrap();
            let path = delta
                .new_file()
                .path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().into_owned())
                .unwrap_or_default();

            let status = match delta.status() {
                git2::Delta::Added => CommitFileStatus::Added,
                git2::Delta::Deleted => CommitFileStatus::Deleted,
                git2::Delta::Renamed => CommitFileStatus::Renamed,
                _ => CommitFileStatus::Modified,
            };

            files.push(CommitFileChange {
                path,
                status,
                additions: 0,
                deletions: 0,
            });
        }

        // Count per-file stats via patch
        let num_deltas = diff.deltas().len();
        for idx in 0..num_deltas {
            if let Ok(Some(patch)) = git2::Patch::from_diff(&diff, idx) {
                let (_, adds, dels) = patch.line_stats().unwrap_or((0, 0, 0));
                if let Some(file) = files.get_mut(idx) {
                    file.additions = adds as u32;
                    file.deletions = dels as u32;
                }
            }
        }

        let stats = CommitStats {
            additions: diff_stats.insertions() as u32,
            deletions: diff_stats.deletions() as u32,
            files_changed: diff_stats.files_changed() as u32,
        };

        Ok(CommitDetail { info, files, stats })
    }

    fn get_commit_file_diff(&self, oid: &str, path: &str) -> GitResult<Vec<FileDiff>> {
        let repo = self.repo.lock().unwrap();
        let commit_oid = Oid::from_str(oid).map_err(|_| GitError::CommitNotFound {
            oid: oid.to_string(),
        })?;
        let commit = repo
            .find_commit(commit_oid)
            .map_err(|_| GitError::CommitNotFound {
                oid: oid.to_string(),
            })?;

        let commit_tree = commit
            .tree()
            .map_err(|e| GitError::DiffFailed(Box::new(e)))?;
        let parent_tree = commit.parent(0).ok().and_then(|p| p.tree().ok());

        let mut diff_opts = Git2DiffOptions::new();
        diff_opts.pathspec(path);

        let diff = repo
            .diff_tree_to_tree(
                parent_tree.as_ref(),
                Some(&commit_tree),
                Some(&mut diff_opts),
            )
            .map_err(|e| GitError::DiffFailed(Box::new(e)))?;

        let file_diffs =
            parse_diff_to_file_diffs(&diff).map_err(|e| GitError::DiffFailed(Box::new(e)))?;

        Ok(file_diffs)
    }

    fn get_blame(&self, path: &str, commit_oid: Option<&str>) -> GitResult<BlameResult> {
        let repo = self.repo.lock().unwrap();

        let mut opts = git2::BlameOptions::new();
        if let Some(oid_str) = commit_oid {
            let oid = Oid::from_str(oid_str).map_err(|e| GitError::BlameFailed(Box::new(e)))?;
            opts.newest_commit(oid);
        }

        let blame = repo
            .blame_file(Path::new(path), Some(&mut opts))
            .map_err(|e| GitError::BlameFailed(Box::new(e)))?;

        let mut lines = Vec::new();
        let mut last_oid: Option<Oid> = None;

        // AR-002: Use the specified commit's tree, not always HEAD
        let tree = if let Some(oid_str) = commit_oid {
            let oid = Oid::from_str(oid_str).map_err(|e| GitError::BlameFailed(Box::new(e)))?;
            let commit = repo
                .find_commit(oid)
                .map_err(|e| GitError::BlameFailed(Box::new(e)))?;
            commit
                .tree()
                .map_err(|e| GitError::BlameFailed(Box::new(e)))?
        } else {
            let head = repo
                .head()
                .map_err(|e| GitError::BlameFailed(Box::new(e)))?;
            head.peel_to_tree()
                .map_err(|e| GitError::BlameFailed(Box::new(e)))?
        };
        let entry = tree
            .get_path(Path::new(path))
            .map_err(|e| GitError::BlameFailed(Box::new(e)))?;
        let blob = repo
            .find_blob(entry.id())
            .map_err(|e| GitError::BlameFailed(Box::new(e)))?;
        let content = String::from_utf8_lossy(blob.content());
        let file_lines: Vec<&str> = content.lines().collect();

        // AR-001: Expand each hunk into individual lines
        for hunk in blame.iter() {
            let start_line = hunk.final_start_line();
            let num_lines = hunk.lines_in_hunk();
            let hunk_oid = hunk.final_commit_id();
            let is_new_block = last_oid != Some(hunk_oid);
            last_oid = Some(hunk_oid);

            let sig = hunk.final_signature();
            let author_name = sig.name().unwrap_or("").to_string();
            let author_date = sig.when().seconds();
            let oid_str = hunk_oid.to_string();
            let short_oid = oid_str[..7].to_string();

            for j in 0..num_lines {
                let line_num = start_line + j;
                let line_content = file_lines.get(line_num - 1).unwrap_or(&"").to_string();

                lines.push(BlameLine {
                    line_number: line_num as u32,
                    content: line_content,
                    commit_oid: oid_str.clone(),
                    commit_short_oid: short_oid.clone(),
                    author_name: author_name.clone(),
                    author_date,
                    is_block_start: is_new_block && j == 0,
                });
            }
        }

        Ok(BlameResult {
            path: path.to_string(),
            lines,
        })
    }

    fn get_file_history(
        &self,
        path: &str,
        limit: usize,
        skip: usize,
    ) -> GitResult<Vec<CommitInfo>> {
        let repo = self.repo.lock().unwrap();

        let mut revwalk = repo
            .revwalk()
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        revwalk
            .set_sorting(Sort::TIME | Sort::TOPOLOGICAL)
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        revwalk
            .push_head()
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;

        let ref_map = build_ref_map(&repo);
        let mut commits = Vec::new();
        let mut skipped = 0;

        for oid_result in revwalk {
            let oid = oid_result.map_err(|e| GitError::LogFailed(Box::new(e)))?;
            let commit = repo
                .find_commit(oid)
                .map_err(|e| GitError::LogFailed(Box::new(e)))?;

            if !commit_touches_path(&repo, &commit, path) {
                continue;
            }

            if skipped < skip {
                skipped += 1;
                continue;
            }

            commits.push(commit_to_info(&commit, &ref_map));

            if commits.len() >= limit {
                break;
            }
        }

        Ok(commits)
    }

    fn get_branch_commits(&self, branch_name: &str, limit: usize) -> GitResult<Vec<CommitInfo>> {
        let repo = self.repo.lock().unwrap();

        let branch = repo
            .find_branch(branch_name, BranchType::Local)
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        let branch_oid = branch
            .get()
            .target()
            .ok_or_else(|| GitError::LogFailed("branch has no target".into()))?;

        let mut revwalk = repo
            .revwalk()
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        revwalk
            .set_sorting(Sort::TIME | Sort::TOPOLOGICAL)
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        revwalk
            .push(branch_oid)
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;

        let ref_map = build_ref_map(&repo);
        let mut commits = Vec::new();

        for oid_result in revwalk {
            let oid = oid_result.map_err(|e| GitError::LogFailed(Box::new(e)))?;
            let commit = repo
                .find_commit(oid)
                .map_err(|e| GitError::LogFailed(Box::new(e)))?;

            commits.push(commit_to_info(&commit, &ref_map));

            if commits.len() >= limit {
                break;
            }
        }

        Ok(commits)
    }

    fn stage_hunk(&self, path: &Path, hunk: &HunkIdentifier) -> GitResult<()> {
        let patch = self.generate_hunk_patch(path, hunk, false)?;
        run_git_apply(&self.workdir, &patch, &["--cached"]).map_err(GitError::StageFailed)
    }

    fn unstage_hunk(&self, path: &Path, hunk: &HunkIdentifier) -> GitResult<()> {
        let patch = self.generate_hunk_patch(path, hunk, true)?;
        run_git_apply(&self.workdir, &patch, &["--cached", "-R"]).map_err(GitError::UnstageFailed)
    }

    fn discard_hunk(&self, path: &Path, hunk: &HunkIdentifier) -> GitResult<()> {
        let patch = self.generate_hunk_patch(path, hunk, false)?;
        run_git_apply(&self.workdir, &patch, &["-R"]).map_err(GitError::DiscardFailed)
    }

    fn stage_lines(&self, path: &Path, line_range: &LineRange) -> GitResult<()> {
        let patch = self.generate_line_patch(path, line_range, false)?;
        run_git_apply(&self.workdir, &patch, &["--cached"]).map_err(GitError::StageFailed)
    }

    fn unstage_lines(&self, path: &Path, line_range: &LineRange) -> GitResult<()> {
        let patch = self.generate_line_patch(path, line_range, true)?;
        run_git_apply(&self.workdir, &patch, &["--cached", "-R"]).map_err(GitError::UnstageFailed)
    }

    fn discard_lines(&self, path: &Path, line_range: &LineRange) -> GitResult<()> {
        let patch = self.generate_line_patch(path, line_range, false)?;
        run_git_apply(&self.workdir, &patch, &["-R"]).map_err(GitError::DiscardFailed)
    }

    fn get_head_commit_message(&self) -> GitResult<String> {
        let repo = self.repo.lock().unwrap();
        let head = repo.head().map_err(|e| GitError::LogFailed(Box::new(e)))?;
        let commit = head
            .peel_to_commit()
            .map_err(|e| GitError::LogFailed(Box::new(e)))?;
        let message = commit.message().unwrap_or("").to_string();
        Ok(message)
    }

    fn stash_save(&self, message: Option<&str>) -> GitResult<()> {
        let mut repo = self.repo.lock().unwrap();
        let signature = repo
            .signature()
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;
        let flags = git2::StashFlags::DEFAULT;
        repo.stash_save(&signature, message.unwrap_or(""), Some(flags))
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;
        Ok(())
    }

    fn stash_list(&self) -> GitResult<Vec<StashEntry>> {
        let mut repo = self.repo.lock().unwrap();
        let mut entries = Vec::new();
        repo.stash_foreach(|index, message, _oid| {
            let msg = message.to_string();
            let branch_name = parse_stash_branch_name(&msg);
            entries.push(StashEntry {
                index,
                message: msg,
                branch_name,
                author_date: 0,
            });
            true
        })
        .map_err(|e| GitError::StashFailed(Box::new(e)))?;

        // Populate author_date from stash reflog
        if let Ok(reflog) = repo.reflog("refs/stash") {
            for entry in &mut entries {
                if let Some(reflog_entry) = reflog.get(entry.index) {
                    entry.author_date = reflog_entry.committer().when().seconds();
                }
            }
        }

        Ok(entries)
    }

    fn stash_apply(&self, index: usize) -> GitResult<()> {
        let mut repo = self.repo.lock().unwrap();
        repo.stash_apply(index, None)
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;
        Ok(())
    }

    fn stash_pop(&self, index: usize) -> GitResult<()> {
        let mut repo = self.repo.lock().unwrap();
        repo.stash_pop(index, None)
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;
        Ok(())
    }

    fn stash_drop(&self, index: usize) -> GitResult<()> {
        let mut repo = self.repo.lock().unwrap();
        repo.stash_drop(index)
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;
        Ok(())
    }

    fn stash_diff(&self, index: usize) -> GitResult<Vec<FileDiff>> {
        let repo = self.repo.lock().unwrap();

        // Get stash commit oid from reflog
        let reflog = repo
            .reflog("refs/stash")
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;
        let reflog_entry = reflog
            .get(index)
            .ok_or_else(|| GitError::StashFailed("stash index out of range".into()))?;
        let stash_oid = reflog_entry.id_new();

        let stash_commit = repo
            .find_commit(stash_oid)
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;
        let stash_tree = stash_commit
            .tree()
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;
        let parent_tree = stash_commit.parent(0).ok().and_then(|p| p.tree().ok());

        let diff = repo
            .diff_tree_to_tree(parent_tree.as_ref(), Some(&stash_tree), None)
            .map_err(|e| GitError::StashFailed(Box::new(e)))?;

        let mut file_diffs =
            parse_diff_to_file_diffs(&diff).map_err(|e| GitError::StashFailed(Box::new(e)))?;

        compute_word_diffs(&mut file_diffs);
        Ok(file_diffs)
    }

    fn list_tags(&self) -> GitResult<Vec<TagInfo>> {
        let repo = self.repo.lock().unwrap();
        let tag_names = repo
            .tag_names(None)
            .map_err(|e| GitError::TagFailed(Box::new(e)))?;

        let mut tags = Vec::new();
        for name in tag_names.iter().flatten() {
            let ref_name = format!("refs/tags/{name}");
            let reference = match repo.find_reference(&ref_name) {
                Ok(r) => r,
                Err(_) => continue,
            };

            // Get the final commit oid for the tag
            let commit_oid = match reference.peel(git2::ObjectType::Commit) {
                Ok(obj) => obj.id(),
                Err(_) => continue,
            };

            let target_short_oid = commit_oid.to_string()[..7].to_string();

            // Check if reference directly points to a tag object (annotated tag)
            let direct_oid = match reference.target() {
                Some(oid) => oid,
                None => continue,
            };

            if let Ok(tag_obj) = repo.find_tag(direct_oid) {
                tags.push(TagInfo {
                    name: name.to_string(),
                    target_oid: commit_oid.to_string(),
                    target_short_oid,
                    is_annotated: true,
                    tagger_name: tag_obj.tagger().map(|t| t.name().unwrap_or("").to_string()),
                    tagger_date: tag_obj.tagger().map(|t| t.when().seconds()),
                    message: tag_obj.message().map(|m| m.to_string()),
                });
            } else {
                tags.push(TagInfo {
                    name: name.to_string(),
                    target_oid: commit_oid.to_string(),
                    target_short_oid,
                    is_annotated: false,
                    tagger_name: None,
                    tagger_date: None,
                    message: None,
                });
            }
        }

        Ok(tags)
    }

    fn create_tag(&self, name: &str, message: Option<&str>) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let head = repo.head().map_err(|e| GitError::TagFailed(Box::new(e)))?;
        let target = head
            .peel(git2::ObjectType::Commit)
            .map_err(|e| GitError::TagFailed(Box::new(e)))?;

        if let Some(msg) = message {
            let sig = repo
                .signature()
                .map_err(|e| GitError::TagFailed(Box::new(e)))?;
            repo.tag(name, &target, &sig, msg, false)
                .map_err(|e| GitError::TagFailed(Box::new(e)))?;
        } else {
            repo.tag_lightweight(name, &target, false)
                .map_err(|e| GitError::TagFailed(Box::new(e)))?;
        }

        Ok(())
    }

    fn delete_tag(&self, name: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let ref_name = format!("refs/tags/{name}");
        let mut reference = repo
            .find_reference(&ref_name)
            .map_err(|e| GitError::TagFailed(Box::new(e)))?;
        reference
            .delete()
            .map_err(|e| GitError::TagFailed(Box::new(e)))?;
        Ok(())
    }

    fn checkout_tag(&self, name: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let ref_name = format!("refs/tags/{name}");
        let reference = repo
            .find_reference(&ref_name)
            .map_err(|e| GitError::TagFailed(Box::new(e)))?;
        let target_oid = reference
            .peel(git2::ObjectType::Commit)
            .map_err(|e| GitError::TagFailed(Box::new(e)))?
            .id();
        repo.set_head_detached(target_oid)
            .map_err(|e| GitError::TagFailed(Box::new(e)))?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
            .map_err(|e| GitError::TagFailed(Box::new(e)))?;
        Ok(())
    }

    fn get_conflict_files(&self) -> GitResult<Vec<ConflictFile>> {
        let repo = self.repo.lock().unwrap();
        let index = repo
            .index()
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        let paths = collect_conflict_paths(&index);

        let mut result = Vec::new();
        for path in paths {
            let full_path = self.workdir.join(&path);
            let content = std::fs::read_to_string(&full_path).unwrap_or_default();
            let blocks = parse_conflict_markers(&content);
            let conflict_count = blocks.len();
            result.push(ConflictFile {
                path,
                conflict_count,
                conflicts: blocks,
            });
        }

        Ok(result)
    }

    fn resolve_conflict(&self, path: &str, resolution: ConflictResolution) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let full_path = self.workdir.join(path);

        let resolved_content = match resolution {
            ConflictResolution::Ours => get_stage_blob_content(&repo, path, 2)?,
            ConflictResolution::Theirs => get_stage_blob_content(&repo, path, 3)?,
            ConflictResolution::Both => {
                let ours = get_stage_blob_content(&repo, path, 2)?;
                let theirs = get_stage_blob_content(&repo, path, 3)?;
                format!("{ours}{theirs}")
            }
            ConflictResolution::Manual(content) => content,
        };

        std::fs::write(&full_path, resolved_content)
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        Ok(())
    }

    fn resolve_conflict_block(
        &self,
        path: &str,
        block_index: usize,
        resolution: ConflictResolution,
    ) -> GitResult<()> {
        let full_path = self.workdir.join(path);
        let content = std::fs::read_to_string(&full_path)
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        let resolved = resolve_single_block(&content, block_index, &resolution)?;

        std::fs::write(&full_path, resolved).map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        Ok(())
    }

    fn mark_resolved(&self, path: &str) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        let mut index = repo
            .index()
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        index
            .add_path(Path::new(path))
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
        index
            .write()
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        Ok(())
    }

    fn abort_merge(&self) -> GitResult<()> {
        let repo = self.repo.lock().unwrap();
        repo.cleanup_state()
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
        Ok(())
    }

    fn continue_merge(&self, message: &str) -> GitResult<CommitResult> {
        let repo = self.repo.lock().unwrap();

        let index = repo
            .index()
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        if index.has_conflicts() {
            return Err(GitError::ConflictFailed(
                "unresolved conflicts remain".into(),
            ));
        }

        let mut index = repo
            .index()
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
        let tree_oid = index
            .write_tree()
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
        let tree = repo
            .find_tree(tree_oid)
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
        let sig = repo
            .signature()
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        let head_commit = repo
            .head()
            .and_then(|h| h.peel_to_commit())
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        // MERGE_HEAD contains the commit being merged
        let merge_head_path = repo.path().join("MERGE_HEAD");
        let merge_head_content = std::fs::read_to_string(&merge_head_path)
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
        let merge_head_oid = git2::Oid::from_str(merge_head_content.trim())
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
        let their_commit = repo
            .find_commit(merge_head_oid)
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        let commit_message = if message.is_empty() {
            let merge_msg_path = repo.path().join("MERGE_MSG");
            std::fs::read_to_string(&merge_msg_path)
                .map(|s| s.trim().to_string())
                .unwrap_or_else(|_| "Merge commit".to_string())
        } else {
            message.to_string()
        };

        let oid = repo
            .commit(
                Some("HEAD"),
                &sig,
                &sig,
                &commit_message,
                &tree,
                &[&head_commit, &their_commit],
            )
            .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

        let _ = repo.cleanup_state();

        Ok(CommitResult {
            oid: oid.to_string(),
        })
    }

    fn is_merging(&self) -> GitResult<bool> {
        let repo = self.repo.lock().unwrap();
        Ok(repo.state() == git2::RepositoryState::Merge)
    }

    fn rebase(&self, onto: &str) -> GitResult<RebaseResult> {
        let output = std::process::Command::new("git")
            .args(["rebase", onto])
            .current_dir(&self.workdir)
            .output()
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        if output.status.success() {
            return Ok(RebaseResult {
                completed: true,
                conflicts: Vec::new(),
            });
        }

        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("CONFLICT") || stderr.contains("conflict") {
            let conflicts = collect_conflict_paths_from_workdir(&self.workdir);
            return Ok(RebaseResult {
                completed: false,
                conflicts,
            });
        }

        Err(GitError::RebaseFailed(stderr.to_string().into()))
    }

    fn interactive_rebase(
        &self,
        onto: &str,
        todo: &[RebaseTodoEntry],
    ) -> GitResult<RebaseResult> {
        let todo_content = todo
            .iter()
            .map(|entry| {
                let action = match entry.action {
                    RebaseAction::Pick => "pick",
                    RebaseAction::Reword => "reword",
                    RebaseAction::Edit => "edit",
                    RebaseAction::Squash => "squash",
                    RebaseAction::Fixup => "fixup",
                    RebaseAction::Drop => "drop",
                };
                format!("{} {} {}", action, entry.short_oid, entry.message)
            })
            .collect::<Vec<_>>()
            .join("\n");

        let todo_file = self.workdir.join(".git").join("rocket-rebase-todo");
        std::fs::write(&todo_file, &todo_content)
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        let escaped_path = todo_file.display().to_string().replace("'", "'\\''");
        let editor_script = format!("cat '{}' > \"$1\"", escaped_path);

        let output = std::process::Command::new("git")
            .args(["rebase", "-i", onto])
            .env("GIT_SEQUENCE_EDITOR", editor_script)
            .current_dir(&self.workdir)
            .output()
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        let _ = std::fs::remove_file(&todo_file);

        if output.status.success() {
            return Ok(RebaseResult {
                completed: true,
                conflicts: Vec::new(),
            });
        }

        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("CONFLICT") || stderr.contains("conflict") || stderr.contains("Stopped at") {
            let conflicts = collect_conflict_paths_from_workdir(&self.workdir);
            return Ok(RebaseResult {
                completed: false,
                conflicts,
            });
        }

        Err(GitError::RebaseFailed(stderr.to_string().into()))
    }

    fn is_rebasing(&self) -> GitResult<bool> {
        let repo = self.repo.lock().unwrap();
        Ok(matches!(
            repo.state(),
            git2::RepositoryState::Rebase
                | git2::RepositoryState::RebaseInteractive
                | git2::RepositoryState::RebaseMerge
        ))
    }

    fn abort_rebase(&self) -> GitResult<()> {
        let output = std::process::Command::new("git")
            .args(["rebase", "--abort"])
            .current_dir(&self.workdir)
            .output()
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(GitError::RebaseFailed(stderr.to_string().into()));
        }

        Ok(())
    }

    fn continue_rebase(&self) -> GitResult<RebaseResult> {
        let output = std::process::Command::new("git")
            .args(["rebase", "--continue"])
            .current_dir(&self.workdir)
            .output()
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        if output.status.success() {
            return Ok(RebaseResult {
                completed: true,
                conflicts: Vec::new(),
            });
        }

        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("CONFLICT") || stderr.contains("conflict") {
            let conflicts = collect_conflict_paths_from_workdir(&self.workdir);
            return Ok(RebaseResult {
                completed: false,
                conflicts,
            });
        }

        Err(GitError::RebaseFailed(stderr.to_string().into()))
    }

    fn get_rebase_state(&self) -> GitResult<Option<RebaseState>> {
        let repo = self.repo.lock().unwrap();
        let git_dir = repo.path();

        let rebase_merge = git_dir.join("rebase-merge");
        let rebase_apply = git_dir.join("rebase-apply");

        let rebase_dir = if rebase_merge.is_dir() {
            rebase_merge
        } else if rebase_apply.is_dir() {
            rebase_apply
        } else {
            return Ok(None);
        };

        let onto_oid = std::fs::read_to_string(rebase_dir.join("onto"))
            .unwrap_or_default()
            .trim()
            .to_string();

        let onto_branch = std::fs::read_to_string(rebase_dir.join("onto_name"))
            .unwrap_or_else(|_| onto_oid.clone())
            .trim()
            .trim_start_matches("refs/heads/")
            .to_string();

        let current_step = std::fs::read_to_string(rebase_dir.join("msgnum"))
            .unwrap_or_else(|_| "0".to_string())
            .trim()
            .parse::<usize>()
            .unwrap_or(0);

        let total_steps = std::fs::read_to_string(rebase_dir.join("end"))
            .unwrap_or_else(|_| "0".to_string())
            .trim()
            .parse::<usize>()
            .unwrap_or(0);

        let index = repo
            .index()
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;
        let has_conflicts = index.has_conflicts();

        Ok(Some(RebaseState {
            onto_branch,
            onto_oid,
            current_step,
            total_steps,
            has_conflicts,
        }))
    }

    fn get_rebase_todo(&self, onto: &str, limit: usize) -> GitResult<Vec<RebaseTodoEntry>> {
        let repo = self.repo.lock().unwrap();

        let onto_obj = repo
            .revparse_single(onto)
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;
        let onto_commit = onto_obj
            .peel_to_commit()
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        let head_commit = repo
            .head()
            .and_then(|h| h.peel_to_commit())
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        let merge_base = repo
            .merge_base(onto_commit.id(), head_commit.id())
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        let mut revwalk = repo
            .revwalk()
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;
        revwalk.set_sorting(Sort::TOPOLOGICAL | Sort::REVERSE)
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;
        revwalk.push(head_commit.id())
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;
        revwalk.hide(merge_base)
            .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

        let mut entries = Vec::new();
        for oid_result in revwalk {
            if entries.len() >= limit {
                break;
            }
            let oid = oid_result.map_err(|e| GitError::RebaseFailed(Box::new(e)))?;
            let commit = repo
                .find_commit(oid)
                .map_err(|e| GitError::RebaseFailed(Box::new(e)))?;

            let oid_str = oid.to_string();
            let short_oid = oid_str[..7.min(oid_str.len())].to_string();
            let message = commit
                .summary()
                .unwrap_or("")
                .to_string();
            let author_name = commit.author().name().unwrap_or("").to_string();

            entries.push(RebaseTodoEntry {
                action: RebaseAction::Pick,
                oid: oid_str,
                short_oid,
                message,
                author_name,
            });
        }

        Ok(entries)
    }

    fn get_merge_base_content(&self, path: &str) -> GitResult<MergeBaseContent> {
        let repo = self.repo.lock().unwrap();

        let base_content = get_stage_blob_content(&repo, path, 1).ok();
        let ours_content = get_stage_blob_content(&repo, path, 2)?;
        let theirs_content = get_stage_blob_content(&repo, path, 3)?;

        Ok(MergeBaseContent {
            path: path.to_string(),
            base_content,
            ours_content,
            theirs_content,
        })
    }
}

impl Git2Backend {
    fn generate_hunk_patch(
        &self,
        path: &Path,
        hunk: &HunkIdentifier,
        staged: bool,
    ) -> GitResult<String> {
        let options = DiffOptions {
            staged,
            ..Default::default()
        };
        let diffs = self.diff(Some(path), &options)?;

        let file_diff = diffs
            .first()
            .ok_or_else(|| GitError::DiffFailed("no diff found for path".into()))?;

        let matched_hunk = file_diff
            .hunks
            .iter()
            .find(|h| {
                h.old_start == hunk.old_start
                    && h.old_lines == hunk.old_lines
                    && h.new_start == hunk.new_start
                    && h.new_lines == hunk.new_lines
            })
            .ok_or_else(|| GitError::DiffFailed("hunk not found".into()))?;

        let path_str = path.to_string_lossy();
        let mut patch = String::new();
        patch.push_str(&format!("diff --git a/{path_str} b/{path_str}\n"));
        patch.push_str(&format!("--- a/{path_str}\n"));
        patch.push_str(&format!("+++ b/{path_str}\n"));
        patch.push_str(&format!(
            "@@ -{},{} +{},{} @@\n",
            hunk.old_start, hunk.old_lines, hunk.new_start, hunk.new_lines
        ));

        for line in &matched_hunk.lines {
            let prefix = match line.kind {
                DiffLineKind::Addition => "+",
                DiffLineKind::Deletion => "-",
                DiffLineKind::Context => " ",
                _ => continue,
            };
            let content = &line.content;
            if content.ends_with('\n') {
                patch.push_str(&format!("{prefix}{content}"));
            } else {
                patch.push_str(&format!("{prefix}{content}\n"));
                patch.push_str("\\ No newline at end of file\n");
            }
        }

        Ok(patch)
    }

    fn generate_line_patch(
        &self,
        path: &Path,
        line_range: &LineRange,
        staged: bool,
    ) -> GitResult<String> {
        let options = DiffOptions {
            staged,
            ..Default::default()
        };
        let diffs = self.diff(Some(path), &options)?;

        let file_diff = diffs
            .first()
            .ok_or_else(|| GitError::DiffFailed("no diff found for path".into()))?;

        let hunk = &line_range.hunk;
        let matched_hunk = file_diff
            .hunks
            .iter()
            .find(|h| {
                h.old_start == hunk.old_start
                    && h.old_lines == hunk.old_lines
                    && h.new_start == hunk.new_start
                    && h.new_lines == hunk.new_lines
            })
            .ok_or_else(|| GitError::DiffFailed("hunk not found".into()))?;

        let selected: std::collections::HashSet<usize> =
            line_range.line_indices.iter().copied().collect();

        let mut old_lines_count: u32 = 0;
        let mut new_lines_count: u32 = 0;
        let mut patch_lines = Vec::new();

        for (idx, line) in matched_hunk.lines.iter().enumerate() {
            match line.kind {
                DiffLineKind::Context => {
                    old_lines_count += 1;
                    new_lines_count += 1;
                    patch_lines.push((' ', &line.content));
                }
                DiffLineKind::Addition => {
                    if selected.contains(&idx) {
                        new_lines_count += 1;
                        patch_lines.push(('+', &line.content));
                    }
                }
                DiffLineKind::Deletion => {
                    if selected.contains(&idx) {
                        old_lines_count += 1;
                        patch_lines.push(('-', &line.content));
                    } else {
                        old_lines_count += 1;
                        new_lines_count += 1;
                        patch_lines.push((' ', &line.content));
                    }
                }
                _ => continue,
            }
        }

        let path_str = path.to_string_lossy();
        let mut patch = String::new();
        patch.push_str(&format!("diff --git a/{path_str} b/{path_str}\n"));
        patch.push_str(&format!("--- a/{path_str}\n"));
        patch.push_str(&format!("+++ b/{path_str}\n"));
        patch.push_str(&format!(
            "@@ -{},{} +{},{} @@\n",
            hunk.old_start, old_lines_count, hunk.new_start, new_lines_count
        ));

        for (prefix, content) in &patch_lines {
            if content.ends_with('\n') {
                patch.push_str(&format!("{prefix}{content}"));
            } else {
                patch.push_str(&format!("{prefix}{content}\n"));
                patch.push_str("\\ No newline at end of file\n");
            }
        }

        Ok(patch)
    }

    fn merge_after_fetch(
        &self,
        remote_ref_name: &str,
        analysis: git2::MergeAnalysis,
        target_oid: git2::Oid,
    ) -> GitResult<MergeResult> {
        let repo = self.repo.lock().unwrap();

        if analysis.is_fast_forward() {
            let head_ref = repo.head().map_err(|e| GitError::PullFailed(Box::new(e)))?;
            let head_name = head_ref
                .name()
                .ok_or_else(|| GitError::PullFailed("HEAD has no name".into()))?
                .to_string();
            drop(head_ref);

            repo.reference(
                &head_name,
                target_oid,
                true,
                &format!("Fast-forward to {remote_ref_name}"),
            )
            .map_err(|e| GitError::PullFailed(Box::new(e)))?;
            repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
                .map_err(|e| GitError::PullFailed(Box::new(e)))?;

            return Ok(MergeResult {
                kind: MergeKind::FastForward,
                oid: Some(target_oid.to_string()),
                conflicts: vec![],
            });
        }

        let annotated = repo
            .find_annotated_commit(target_oid)
            .map_err(|e| GitError::PullFailed(Box::new(e)))?;

        self.merge_normal_commit(&repo, remote_ref_name, &annotated)
            .map_err(|e| match e {
                GitError::MergeFailed(inner) => GitError::PullFailed(inner),
                other => other,
            })
    }

    fn rebase_after_fetch(&self, target_oid: git2::Oid) -> GitResult<MergeResult> {
        let repo = self.repo.lock().unwrap();

        let head = repo.head().map_err(|e| GitError::PullFailed(Box::new(e)))?;
        let head_annotated = repo
            .find_annotated_commit(
                head.target()
                    .ok_or_else(|| GitError::PullFailed("HEAD has no target".into()))?,
            )
            .map_err(|e| GitError::PullFailed(Box::new(e)))?;
        drop(head);

        let upstream_annotated = repo
            .find_annotated_commit(target_oid)
            .map_err(|e| GitError::PullFailed(Box::new(e)))?;

        let mut rebase = repo
            .rebase(Some(&head_annotated), Some(&upstream_annotated), None, None)
            .map_err(|e| GitError::PullFailed(Box::new(e)))?;

        let sig = repo
            .signature()
            .map_err(|e| GitError::PullFailed(Box::new(e)))?;

        let mut last_oid = target_oid;
        while rebase.next().is_some() {
            let index = repo
                .index()
                .map_err(|e| GitError::PullFailed(Box::new(e)))?;
            if index.has_conflicts() {
                let _ = rebase.abort();
                return Err(GitError::PullFailed("rebase conflicts detected".into()));
            }
            last_oid = rebase
                .commit(None, &sig, None)
                .map_err(|e| GitError::PullFailed(Box::new(e)))?;
        }

        rebase
            .finish(Some(&sig))
            .map_err(|e| GitError::PullFailed(Box::new(e)))?;

        Ok(MergeResult {
            kind: MergeKind::Rebase,
            oid: Some(last_oid.to_string()),
            conflicts: vec![],
        })
    }

    fn merge_normal_commit(
        &self,
        repo: &Repository,
        branch_name: &str,
        annotated: &git2::AnnotatedCommit,
    ) -> GitResult<MergeResult> {
        let mut checkout_opts = git2::build::CheckoutBuilder::new();
        checkout_opts.allow_conflicts(true);

        let mut merge_opts = git2::MergeOptions::new();

        repo.merge(
            &[annotated],
            Some(&mut merge_opts),
            Some(&mut checkout_opts),
        )
        .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        let index = repo
            .index()
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        if index.has_conflicts() {
            return Ok(MergeResult {
                kind: MergeKind::Conflict,
                oid: None,
                conflicts: collect_conflict_paths(&index),
            });
        }

        let mut index = repo
            .index()
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        let tree_oid = index
            .write_tree()
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;
        let tree = repo
            .find_tree(tree_oid)
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;
        let sig = repo
            .signature()
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        let head_commit = repo
            .head()
            .and_then(|h| h.peel_to_commit())
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;
        let their_commit = repo
            .find_commit(annotated.id())
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        let message = format!("Merge branch '{branch_name}'");
        let oid = repo
            .commit(
                Some("HEAD"),
                &sig,
                &sig,
                &message,
                &tree,
                &[&head_commit, &their_commit],
            )
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        let _ = repo.cleanup_state();

        Ok(MergeResult {
            kind: MergeKind::Normal,
            oid: Some(oid.to_string()),
            conflicts: vec![],
        })
    }
}

fn index_status_to_kind(status: git2::Status) -> FileStatusKind {
    if status.contains(git2::Status::INDEX_NEW) {
        FileStatusKind::Untracked
    } else if status.contains(git2::Status::INDEX_MODIFIED) {
        FileStatusKind::Modified
    } else if status.contains(git2::Status::INDEX_DELETED) {
        FileStatusKind::Deleted
    } else if status.contains(git2::Status::INDEX_RENAMED) {
        FileStatusKind::Renamed
    } else {
        FileStatusKind::Typechange
    }
}

fn wt_status_to_kind(status: git2::Status) -> FileStatusKind {
    if status.contains(git2::Status::WT_NEW) {
        FileStatusKind::Untracked
    } else if status.contains(git2::Status::WT_MODIFIED) {
        FileStatusKind::Modified
    } else if status.contains(git2::Status::WT_DELETED) {
        FileStatusKind::Deleted
    } else if status.contains(git2::Status::WT_RENAMED) {
        FileStatusKind::Renamed
    } else {
        FileStatusKind::Typechange
    }
}

type RefMap = std::collections::HashMap<Oid, Vec<CommitRef>>;

fn build_ref_map(repo: &Repository) -> RefMap {
    let mut map: RefMap = std::collections::HashMap::new();

    let head_oid = repo.head().ok().and_then(|h| h.target());

    if let Ok(branches) = repo.branches(None) {
        for branch in branches.flatten() {
            let (branch, branch_type) = branch;
            if let Some(oid) = branch.get().target() {
                let name = branch.name().ok().flatten().unwrap_or("").to_string();
                let kind = if branch_type == BranchType::Remote {
                    CommitRefKind::RemoteBranch
                } else {
                    CommitRefKind::LocalBranch
                };
                map.entry(oid).or_default().push(CommitRef { name, kind });
            }
        }
    }

    if let Ok(tags) = repo.tag_names(None) {
        for tag_name in tags.iter().flatten() {
            if let Ok(reference) = repo.find_reference(&format!("refs/tags/{tag_name}")) {
                if let Some(oid) = reference.target() {
                    // Resolve annotated tags
                    let resolved = repo
                        .find_tag(oid)
                        .ok()
                        .and_then(|t| t.target().ok())
                        .map(|obj| obj.id())
                        .unwrap_or(oid);
                    map.entry(resolved).or_default().push(CommitRef {
                        name: tag_name.to_string(),
                        kind: CommitRefKind::Tag,
                    });
                }
            }
        }
    }

    if let Some(head_oid) = head_oid {
        map.entry(head_oid).or_default().insert(
            0,
            CommitRef {
                name: "HEAD".to_string(),
                kind: CommitRefKind::Head,
            },
        );
    }

    map
}

fn commit_to_info(commit: &git2::Commit, ref_map: &RefMap) -> CommitInfo {
    let oid = commit.id();
    let oid_str = oid.to_string();
    let short_oid = oid_str[..7].to_string();

    let message_full = commit.message().unwrap_or("").to_string();
    let mut parts = message_full.splitn(2, '\n');
    let message = parts.next().unwrap_or("").to_string();
    let body = parts.next().unwrap_or("").trim().to_string();

    let author = commit.author();
    let author_name = author.name().unwrap_or("").to_string();
    let author_email = author.email().unwrap_or("").to_string();
    let author_date = author.when().seconds();

    let parent_oids: Vec<String> = (0..commit.parent_count())
        .filter_map(|i| commit.parent_id(i).ok())
        .map(|id| id.to_string())
        .collect();

    let refs = ref_map.get(&oid).cloned().unwrap_or_default();

    CommitInfo {
        oid: oid_str,
        short_oid,
        message,
        body,
        author_name,
        author_email,
        author_date,
        parent_oids,
        refs,
    }
}

fn matches_filter(repo: &Repository, commit: &git2::Commit, filter: &LogFilter) -> bool {
    if let Some(ref author) = filter.author {
        let name = commit.author().name().unwrap_or("").to_lowercase();
        if !name.contains(&author.to_lowercase()) {
            return false;
        }
    }

    if let Some(since) = filter.since {
        if commit.time().seconds() < since {
            return false;
        }
    }

    if let Some(until) = filter.until {
        if commit.time().seconds() > until {
            return false;
        }
    }

    if let Some(ref msg) = filter.message {
        let commit_msg = commit.message().unwrap_or("").to_lowercase();
        if !commit_msg.contains(&msg.to_lowercase()) {
            return false;
        }
    }

    if let Some(ref path) = filter.path {
        if !commit_touches_path(repo, commit, path) {
            return false;
        }
    }

    true
}

fn commit_touches_path(repo: &Repository, commit: &git2::Commit, path: &str) -> bool {
    let commit_tree = match commit.tree() {
        Ok(t) => t,
        Err(_) => return false,
    };
    let parent_tree = commit.parent(0).ok().and_then(|p| p.tree().ok());

    let mut diff_opts = Git2DiffOptions::new();
    diff_opts.pathspec(path);

    let diff = match repo.diff_tree_to_tree(
        parent_tree.as_ref(),
        Some(&commit_tree),
        Some(&mut diff_opts),
    ) {
        Ok(d) => d,
        Err(_) => return false,
    };

    diff.deltas().len() > 0
}

fn build_graph(commits: &[CommitInfo]) -> Vec<CommitGraphRow> {
    let mut lanes: Vec<Option<String>> = Vec::new();
    let mut rows = Vec::new();

    for commit in commits {
        // Find the lane for this commit
        let column = lanes
            .iter()
            .position(|lane| lane.as_deref() == Some(&commit.oid));

        let column = match column {
            Some(col) => {
                lanes[col] = None;
                col
            }
            None => {
                let empty = lanes.iter().position(|l| l.is_none());
                match empty {
                    Some(col) => col,
                    None => {
                        lanes.push(None);
                        lanes.len() - 1
                    }
                }
            }
        };

        let node_type = if commit.parent_oids.len() > 1 {
            GraphNodeType::Merge
        } else {
            GraphNodeType::Normal
        };

        let mut edges = Vec::new();

        for (i, parent_oid) in commit.parent_oids.iter().enumerate() {
            if i == 0 {
                // First parent goes to same lane
                lanes[column] = Some(parent_oid.clone());
                edges.push(GraphEdge {
                    from_column: column,
                    to_column: column,
                    color_index: column,
                });
            } else {
                // Additional parents get new lanes
                let existing = lanes.iter().position(|l| l.as_deref() == Some(parent_oid));
                let to_col = match existing {
                    Some(col) => col,
                    None => {
                        let empty = lanes.iter().position(|l| l.is_none());
                        match empty {
                            Some(col) => {
                                lanes[col] = Some(parent_oid.clone());
                                col
                            }
                            None => {
                                lanes.push(Some(parent_oid.clone()));
                                lanes.len() - 1
                            }
                        }
                    }
                };
                edges.push(GraphEdge {
                    from_column: column,
                    to_column: to_col,
                    color_index: to_col,
                });
            }
        }

        rows.push(CommitGraphRow {
            oid: commit.oid.clone(),
            column,
            node_type,
            edges,
        });
    }

    // Trim empty trailing lanes from each row
    rows
}

fn run_git_apply(
    workdir: &Path,
    patch: &str,
    extra_args: &[&str],
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    use std::io::Write;

    let mut cmd = std::process::Command::new("git");
    cmd.arg("-C")
        .arg(workdir)
        .arg("apply")
        .args(extra_args)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn()?;
    if let Some(ref mut stdin) = child.stdin {
        stdin.write_all(patch.as_bytes())?;
    }
    let output = child.wait_with_output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(stderr.to_string().into());
    }
    Ok(())
}

fn tokenize_words(s: &str) -> Vec<&str> {
    let mut tokens = Vec::new();
    let mut start = 0;
    let bytes = s.as_bytes();

    for (i, &b) in bytes.iter().enumerate() {
        let is_sep = b.is_ascii_whitespace() || b.is_ascii_punctuation();
        if is_sep {
            if start < i {
                tokens.push(&s[start..i]);
            }
            tokens.push(&s[i..i + 1]);
            start = i + 1;
        }
    }
    if start < s.len() {
        tokens.push(&s[start..]);
    }
    tokens
}

fn lcs_length(a: &[&str], b: &[&str]) -> Vec<Vec<usize>> {
    let m = a.len();
    let n = b.len();
    let mut dp = vec![vec![0usize; n + 1]; m + 1];
    for i in 1..=m {
        for j in 1..=n {
            if a[i - 1] == b[j - 1] {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = dp[i - 1][j].max(dp[i][j - 1]);
            }
        }
    }
    dp
}

fn compute_word_diff_pair(
    del_content: &str,
    add_content: &str,
) -> (Vec<WordSegment>, Vec<WordSegment>) {
    let del_tokens = tokenize_words(del_content);
    let add_tokens = tokenize_words(add_content);
    let dp = lcs_length(&del_tokens, &add_tokens);

    let mut del_segments = Vec::new();
    let mut add_segments = Vec::new();

    let mut i = del_tokens.len();
    let mut j = add_tokens.len();
    let mut del_marked: Vec<bool> = vec![false; del_tokens.len()];
    let mut add_marked: Vec<bool> = vec![false; add_tokens.len()];

    while i > 0 && j > 0 {
        if del_tokens[i - 1] == add_tokens[j - 1] {
            i -= 1;
            j -= 1;
        } else if dp[i - 1][j] >= dp[i][j - 1] {
            del_marked[i - 1] = true;
            i -= 1;
        } else {
            add_marked[j - 1] = true;
            j -= 1;
        }
    }
    while i > 0 {
        del_marked[i - 1] = true;
        i -= 1;
    }
    while j > 0 {
        add_marked[j - 1] = true;
        j -= 1;
    }

    let mut cur_text = String::new();
    let mut cur_highlighted = false;
    for (idx, token) in del_tokens.iter().enumerate() {
        let highlighted = del_marked[idx];
        if idx > 0 && highlighted != cur_highlighted {
            del_segments.push(WordSegment {
                text: cur_text.clone(),
                highlighted: cur_highlighted,
            });
            cur_text.clear();
        }
        cur_highlighted = highlighted;
        cur_text.push_str(token);
    }
    if !cur_text.is_empty() {
        del_segments.push(WordSegment {
            text: cur_text,
            highlighted: cur_highlighted,
        });
    }

    cur_text = String::new();
    cur_highlighted = false;
    for (idx, token) in add_tokens.iter().enumerate() {
        let highlighted = add_marked[idx];
        if idx > 0 && highlighted != cur_highlighted {
            add_segments.push(WordSegment {
                text: cur_text.clone(),
                highlighted: cur_highlighted,
            });
            cur_text.clear();
        }
        cur_highlighted = highlighted;
        cur_text.push_str(token);
    }
    if !cur_text.is_empty() {
        add_segments.push(WordSegment {
            text: cur_text,
            highlighted: cur_highlighted,
        });
    }

    (del_segments, add_segments)
}

/// Parse branch name from git stash message.
/// Format: "WIP on <branch>: ..." or "On <branch>: <msg>"
fn parse_stash_branch_name(message: &str) -> String {
    if let Some(rest) = message.strip_prefix("WIP on ") {
        if let Some(colon_pos) = rest.find(':') {
            return rest[..colon_pos].to_string();
        }
    }
    if let Some(rest) = message.strip_prefix("On ") {
        if let Some(colon_pos) = rest.find(':') {
            return rest[..colon_pos].to_string();
        }
    }
    String::new()
}

fn parse_diff_to_file_diffs(diff: &git2::Diff) -> Result<Vec<FileDiff>, git2::Error> {
    let mut file_diffs: Vec<FileDiff> = Vec::new();

    diff.print(DiffFormat::Patch, |delta, hunk, line| {
        let old_path = delta
            .old_file()
            .path()
            .map(|p| p.to_string_lossy().into_owned());
        let new_path = delta
            .new_file()
            .path()
            .map(|p| p.to_string_lossy().into_owned());

        let needs_new = file_diffs
            .last()
            .map(|fd| fd.old_path != old_path || fd.new_path != new_path)
            .unwrap_or(true);

        if needs_new {
            file_diffs.push(FileDiff {
                old_path: old_path.clone(),
                new_path: new_path.clone(),
                hunks: Vec::new(),
            });
        }

        let file_diff = file_diffs.last_mut().unwrap();

        match line.origin() {
            'H' | 'F' => {}
            _ => {
                if let Some(h) = hunk {
                    let header_str = String::from_utf8_lossy(h.header()).to_string();
                    let needs_hunk = file_diff
                        .hunks
                        .last()
                        .map(|dh| dh.header != header_str)
                        .unwrap_or(true);

                    if needs_hunk {
                        file_diff.hunks.push(DiffHunk {
                            header: header_str,
                            old_start: h.old_start(),
                            old_lines: h.old_lines(),
                            new_start: h.new_start(),
                            new_lines: h.new_lines(),
                            lines: Vec::new(),
                        });
                    }
                }

                if let Some(current_hunk) = file_diff.hunks.last_mut() {
                    let kind = match line.origin() {
                        '+' | '>' => DiffLineKind::Addition,
                        '-' | '<' => DiffLineKind::Deletion,
                        _ => DiffLineKind::Context,
                    };

                    let content = String::from_utf8_lossy(line.content()).to_string();

                    current_hunk.lines.push(DiffLine {
                        kind,
                        content,
                        old_lineno: line.old_lineno(),
                        new_lineno: line.new_lineno(),
                        word_diff: None,
                    });
                }
            }
        }

        true
    })?;

    Ok(file_diffs)
}

fn collect_conflict_paths_from_workdir(workdir: &Path) -> Vec<String> {
    let output = std::process::Command::new("git")
        .args(["diff", "--name-only", "--diff-filter=U"])
        .current_dir(workdir)
        .output();

    match output {
        Ok(out) if out.status.success() => {
            String::from_utf8_lossy(&out.stdout)
                .lines()
                .filter(|l| !l.is_empty())
                .map(|l| l.to_string())
                .collect()
        }
        _ => Vec::new(),
    }
}

fn collect_conflict_paths(index: &git2::Index) -> Vec<String> {
    let mut paths = Vec::new();
    if let Ok(conflicts) = index.conflicts() {
        for conflict in conflicts.flatten() {
            let path = conflict
                .our
                .as_ref()
                .or(conflict.their.as_ref())
                .and_then(|e| String::from_utf8(e.path.clone()).ok());
            if let Some(p) = path {
                if !paths.contains(&p) {
                    paths.push(p);
                }
            }
        }
    }
    paths
}

fn parse_one_block(lines: &[&str], start: usize) -> (String, Option<String>, String, usize) {
    let mut i = start + 1; // skip <<<<<<<
    let mut ours = String::new();
    while i < lines.len() && !lines[i].starts_with("=======") && !lines[i].starts_with("|||||||") {
        ours.push_str(lines[i]);
        ours.push('\n');
        i += 1;
    }
    // capture diff3 base section (||||||| ... =======) if present
    let base = if i < lines.len() && lines[i].starts_with("|||||||") {
        i += 1;
        let mut base_content = String::new();
        while i < lines.len() && !lines[i].starts_with("=======") {
            base_content.push_str(lines[i]);
            base_content.push('\n');
            i += 1;
        }
        Some(base_content)
    } else {
        None
    };
    i += 1; // skip =======
    let mut theirs = String::new();
    while i < lines.len() && !lines[i].starts_with(">>>>>>>") {
        theirs.push_str(lines[i]);
        theirs.push('\n');
        i += 1;
    }
    i += 1; // skip >>>>>>>
    (ours, base, theirs, i)
}

fn parse_conflict_markers(content: &str) -> Vec<ConflictBlock> {
    let mut blocks = Vec::new();
    let lines: Vec<&str> = content.lines().collect();
    let mut i = 0;

    while i < lines.len() {
        if lines[i].starts_with("<<<<<<<") {
            let start_line = (i + 1) as u32;
            let (ours, base, theirs, next) = parse_one_block(&lines, i);
            let end_line = next as u32;
            blocks.push(ConflictBlock {
                ours,
                base,
                theirs,
                start_line,
                end_line,
            });
            i = next;
        } else {
            i += 1;
        }
    }

    blocks
}

fn get_stage_blob_content(repo: &Repository, path: &str, stage: i32) -> GitResult<String> {
    let index = repo
        .index()
        .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;

    for entry in index.iter() {
        let entry_path = String::from_utf8_lossy(&entry.path).to_string();
        if entry_path == path && (entry.flags & 0x3000) >> 12 == stage as u16 {
            let blob = repo
                .find_blob(entry.id)
                .map_err(|e| GitError::ConflictFailed(Box::new(e)))?;
            return Ok(String::from_utf8_lossy(blob.content()).to_string());
        }
    }

    Err(GitError::ConflictFailed(
        format!("stage {stage} entry not found for {path}").into(),
    ))
}

fn resolve_single_block(
    content: &str,
    block_index: usize,
    resolution: &ConflictResolution,
) -> GitResult<String> {
    let total_blocks = content
        .lines()
        .filter(|line| line.starts_with("<<<<<<<"))
        .count();
    if block_index >= total_blocks {
        return Err(GitError::ConflictFailed(
            format!("block_index {block_index} out of range (total: {total_blocks})").into(),
        ));
    }

    let mut result = String::new();
    let lines: Vec<&str> = content.lines().collect();
    let mut current_block = 0;
    let mut i = 0;

    while i < lines.len() {
        if lines[i].starts_with("<<<<<<<") {
            if current_block == block_index {
                let (ours, _base, theirs, next) = parse_one_block(&lines, i);
                match resolution {
                    ConflictResolution::Ours => result.push_str(&ours),
                    ConflictResolution::Theirs => result.push_str(&theirs),
                    ConflictResolution::Both => {
                        result.push_str(&ours);
                        result.push_str(&theirs);
                    }
                    ConflictResolution::Manual(manual) => {
                        result.push_str(manual);
                        if !manual.ends_with('\n') {
                            result.push('\n');
                        }
                    }
                }
                i = next;
            } else {
                result.push_str(lines[i]);
                result.push('\n');
                i += 1;
            }
            current_block += 1;
        } else {
            result.push_str(lines[i]);
            result.push('\n');
            i += 1;
        }
    }

    Ok(result)
}

fn compute_word_diffs(file_diffs: &mut [FileDiff]) {
    for file_diff in file_diffs.iter_mut() {
        for hunk in file_diff.hunks.iter_mut() {
            let mut i = 0;
            let lines_len = hunk.lines.len();
            while i < lines_len {
                if hunk.lines[i].kind != DiffLineKind::Deletion {
                    i += 1;
                    continue;
                }
                let del_start = i;
                while i < lines_len && hunk.lines[i].kind == DiffLineKind::Deletion {
                    i += 1;
                }
                let del_end = i;

                let add_start = i;
                while i < lines_len && hunk.lines[i].kind == DiffLineKind::Addition {
                    i += 1;
                }
                let add_end = i;

                let del_count = del_end - del_start;
                let add_count = add_end - add_start;
                let pairs = del_count.min(add_count);

                for p in 0..pairs {
                    let (del_segs, add_segs) = compute_word_diff_pair(
                        &hunk.lines[del_start + p].content,
                        &hunk.lines[add_start + p].content,
                    );
                    hunk.lines[del_start + p].word_diff = Some(del_segs);
                    hunk.lines[add_start + p].word_diff = Some(add_segs);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_conflict_markers_standard_format() {
        let content =
            "before\n<<<<<<< HEAD\nours line\n=======\ntheirs line\n>>>>>>> branch\nafter\n";
        let blocks = parse_conflict_markers(content);
        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0].ours, "ours line\n");
        assert_eq!(blocks[0].base, None);
        assert_eq!(blocks[0].theirs, "theirs line\n");
    }

    #[test]
    fn parse_conflict_markers_diff3_format() {
        let content = "before\n<<<<<<< HEAD\nours line\n||||||| base\nbase line\n=======\ntheirs line\n>>>>>>> branch\nafter\n";
        let blocks = parse_conflict_markers(content);
        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0].ours, "ours line\n");
        assert_eq!(blocks[0].base, Some("base line\n".to_string()));
        assert_eq!(blocks[0].theirs, "theirs line\n");
    }

    #[test]
    fn parse_conflict_markers_multiple_blocks() {
        let content = "<<<<<<< HEAD\na\n=======\nb\n>>>>>>> br\nmiddle\n<<<<<<< HEAD\nc\n=======\nd\n>>>>>>> br\n";
        let blocks = parse_conflict_markers(content);
        assert_eq!(blocks.len(), 2);
        assert_eq!(blocks[0].ours, "a\n");
        assert_eq!(blocks[0].base, None);
        assert_eq!(blocks[0].theirs, "b\n");
        assert_eq!(blocks[1].ours, "c\n");
        assert_eq!(blocks[1].base, None);
        assert_eq!(blocks[1].theirs, "d\n");
    }

    #[test]
    fn parse_conflict_markers_diff3_with_multiple_base_lines() {
        let content = "<<<<<<< HEAD\nours1\nours2\n||||||| base-ref\nbase1\nbase2\nbase3\n=======\ntheirs1\n>>>>>>> branch\n";
        let blocks = parse_conflict_markers(content);
        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0].ours, "ours1\nours2\n");
        assert_eq!(blocks[0].base, Some("base1\nbase2\nbase3\n".to_string()));
        assert_eq!(blocks[0].theirs, "theirs1\n");
    }

    #[test]
    fn resolve_single_block_with_diff3() {
        let content = "before\n<<<<<<< HEAD\nours\n||||||| base\noriginal\n=======\ntheirs\n>>>>>>> branch\nafter\n";
        let result = resolve_single_block(content, 0, &ConflictResolution::Ours).unwrap();
        assert_eq!(result, "before\nours\nafter\n");

        let result = resolve_single_block(content, 0, &ConflictResolution::Theirs).unwrap();
        assert_eq!(result, "before\ntheirs\nafter\n");

        let result = resolve_single_block(content, 0, &ConflictResolution::Both).unwrap();
        assert_eq!(result, "before\nours\ntheirs\nafter\n");
    }

    #[test]
    fn resolve_single_block_out_of_range() {
        let content = "<<<<<<< HEAD\na\n=======\nb\n>>>>>>> br\n";
        let result = resolve_single_block(content, 1, &ConflictResolution::Ours);
        assert!(result.is_err());
    }
}
