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
    CommitStats, DiffHunk, DiffLine, DiffLineKind, DiffOptions, FetchResult, FileDiff, FileStatus,
    FileStatusKind, GraphEdge, GraphNodeType, LogFilter, MergeKind, MergeOption, MergeResult,
    PullOption, PushResult, RemoteInfo, RepoStatus, StagingState,
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

            // Ensure we have a FileDiff for this delta
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
                'H' | 'F' => {
                    // File header line — skip, we track files via delta
                }
                _ => {
                    // If there's a new hunk header, start a new hunk
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
                        });
                    }
                }
            }

            true
        })
        .map_err(|e| GitError::DiffFailed(Box::new(e)))?;

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

    fn commit(&self, message: &str) -> GitResult<CommitResult> {
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

            result.push(BranchInfo {
                name,
                is_head,
                is_remote,
                remote_name,
                upstream,
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
                        });
                    }
                }
            }
            true
        })
        .map_err(|e| GitError::DiffFailed(Box::new(e)))?;

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
}

impl Git2Backend {
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
        })
    }

    fn merge_normal_commit(
        &self,
        repo: &Repository,
        branch_name: &str,
        annotated: &git2::AnnotatedCommit,
    ) -> GitResult<MergeResult> {
        repo.merge(&[annotated], None, None)
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        let mut index = repo
            .index()
            .map_err(|e| GitError::MergeFailed(Box::new(e)))?;

        if index.has_conflicts() {
            let _ = repo.cleanup_state();
            return Err(GitError::MergeFailed("merge conflicts detected".into()));
        }

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
