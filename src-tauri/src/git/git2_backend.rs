use std::path::{Path, PathBuf};
use std::sync::Mutex;

use git2::{BranchType, DiffFormat, DiffOptions as Git2DiffOptions, Repository, StatusOptions};

use crate::git::auth::create_credentials_callback;
use crate::git::backend::GitBackend;
use crate::git::error::{GitError, GitResult};
use crate::git::types::{
    BranchInfo, CommitResult, DiffHunk, DiffLine, DiffLineKind, DiffOptions, FetchResult, FileDiff,
    FileStatus, FileStatusKind, MergeKind, MergeOption, MergeResult, PullOption, PushResult,
    RemoteInfo, RepoStatus, StagingState,
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
