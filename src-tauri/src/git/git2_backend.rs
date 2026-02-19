use std::path::{Path, PathBuf};
use std::sync::Mutex;

use git2::{DiffFormat, DiffOptions as Git2DiffOptions, Repository, StatusOptions};

use crate::git::backend::GitBackend;
use crate::git::error::{GitError, GitResult};
use crate::git::types::{
    CommitResult, DiffHunk, DiffLine, DiffLineKind, DiffOptions, FileDiff, FileStatus,
    FileStatusKind, RepoStatus, StagingState,
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
    fn workdir(&self) -> &Path {
        &self.workdir
    }

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
