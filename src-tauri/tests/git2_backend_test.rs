use std::fs;
use std::path::Path;
use std::process::Command;

use app_lib::git::backend::GitBackend;
use app_lib::git::git2_backend::Git2Backend;
use app_lib::git::types::{DiffOptions, MergeOption, PullOption};

fn init_test_repo(dir: &Path) {
    Command::new("git")
        .args(["init"])
        .current_dir(dir)
        .output()
        .expect("git init failed");

    Command::new("git")
        .args(["config", "user.email", "test@example.com"])
        .current_dir(dir)
        .output()
        .expect("git config email failed");

    Command::new("git")
        .args(["config", "user.name", "Test User"])
        .current_dir(dir)
        .output()
        .expect("git config name failed");
}

fn init_repo_with_commit(dir: &Path) -> Git2Backend {
    init_test_repo(dir);
    fs::write(dir.join("init.txt"), "init").unwrap();
    let backend = Git2Backend::open(dir).unwrap();
    backend.stage(Path::new("init.txt")).unwrap();
    backend.commit("initial commit").unwrap();
    backend
}

#[test]
fn status_empty_repo() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    let backend = Git2Backend::open(tmp.path()).unwrap();
    let status = backend.status().unwrap();

    assert!(status.files.is_empty());
}

#[test]
fn status_shows_untracked_file() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("hello.txt"), "hello").unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();
    let status = backend.status().unwrap();

    assert_eq!(status.files.len(), 1);
    assert_eq!(status.files[0].path, "hello.txt");
    assert_eq!(
        status.files[0].staging,
        app_lib::git::types::StagingState::Unstaged
    );
}

#[test]
fn stage_and_unstage_file() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("a.txt"), "content").unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();

    // Stage
    backend.stage(Path::new("a.txt")).unwrap();
    let status = backend.status().unwrap();
    assert!(status
        .files
        .iter()
        .any(|f| f.path == "a.txt" && f.staging == app_lib::git::types::StagingState::Staged));

    // Unstage
    backend.unstage(Path::new("a.txt")).unwrap();
    let status = backend.status().unwrap();
    assert!(status
        .files
        .iter()
        .all(|f| f.staging == app_lib::git::types::StagingState::Unstaged));
}

#[test]
fn stage_all_and_unstage_all() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("a.txt"), "a").unwrap();
    fs::write(tmp.path().join("b.txt"), "b").unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();

    backend.stage_all().unwrap();
    let status = backend.status().unwrap();
    assert!(status
        .files
        .iter()
        .all(|f| f.staging == app_lib::git::types::StagingState::Staged));

    backend.unstage_all().unwrap();
    let status = backend.status().unwrap();
    assert!(status
        .files
        .iter()
        .all(|f| f.staging == app_lib::git::types::StagingState::Unstaged));
}

#[test]
fn commit_creates_oid() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("file.txt"), "data").unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();
    backend.stage(Path::new("file.txt")).unwrap();

    let result = backend.commit("initial commit").unwrap();
    assert!(!result.oid.is_empty());
}

#[test]
fn current_branch_after_commit() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("file.txt"), "data").unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();
    backend.stage(Path::new("file.txt")).unwrap();
    backend.commit("init").unwrap();

    let branch = backend.current_branch().unwrap();
    assert!(!branch.is_empty());
}

#[test]
fn diff_unstaged_changes() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("file.txt"), "line1\n").unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();
    backend.stage(Path::new("file.txt")).unwrap();
    backend.commit("init").unwrap();

    fs::write(tmp.path().join("file.txt"), "line1\nline2\n").unwrap();

    let options = DiffOptions {
        staged: false,
        ..Default::default()
    };
    let diffs = backend.diff(Some(Path::new("file.txt")), &options).unwrap();

    assert!(!diffs.is_empty());
    assert!(!diffs[0].hunks.is_empty());
}

#[test]
fn diff_staged_changes() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("file.txt"), "original\n").unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();
    backend.stage(Path::new("file.txt")).unwrap();
    backend.commit("init").unwrap();

    fs::write(tmp.path().join("file.txt"), "modified\n").unwrap();
    backend.stage(Path::new("file.txt")).unwrap();

    let options = DiffOptions {
        staged: true,
        ..Default::default()
    };
    let diffs = backend.diff(Some(Path::new("file.txt")), &options).unwrap();

    assert!(!diffs.is_empty());
}

#[test]
fn open_nonexistent_path_returns_error() {
    let result = Git2Backend::open("/nonexistent/path/to/repo");
    assert!(result.is_err());
}

#[test]
fn list_branches_returns_default_branch() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let branches = backend.list_branches().unwrap();

    assert!(!branches.is_empty());
    assert!(branches.iter().any(|b| b.is_head));
}

#[test]
fn create_and_list_branch() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    backend.create_branch("feature").unwrap();
    let branches = backend.list_branches().unwrap();

    assert!(branches.iter().any(|b| b.name == "feature"));
}

#[test]
fn checkout_branch() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend.create_branch("feature").unwrap();

    backend.checkout_branch("feature").unwrap();
    let current = backend.current_branch().unwrap();

    assert_eq!(current, "feature");
}

#[test]
fn delete_branch() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend.create_branch("to-delete").unwrap();

    backend.delete_branch("to-delete").unwrap();
    let branches = backend.list_branches().unwrap();

    assert!(!branches.iter().any(|b| b.name == "to-delete"));
}

#[test]
fn rename_branch() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend.create_branch("old-name").unwrap();

    backend.rename_branch("old-name", "new-name").unwrap();
    let branches = backend.list_branches().unwrap();

    assert!(!branches.iter().any(|b| b.name == "old-name"));
    assert!(branches.iter().any(|b| b.name == "new-name"));
}

#[test]
fn merge_fast_forward() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let default_branch = backend.current_branch().unwrap();

    backend.create_branch("feature").unwrap();
    backend.checkout_branch("feature").unwrap();

    fs::write(tmp.path().join("feature.txt"), "feature work").unwrap();
    backend.stage(Path::new("feature.txt")).unwrap();
    backend.commit("feature commit").unwrap();

    backend.checkout_branch(&default_branch).unwrap();

    let result = backend
        .merge_branch("feature", MergeOption::Default)
        .unwrap();
    assert_eq!(result.kind, app_lib::git::types::MergeKind::FastForward);
    assert!(result.oid.is_some());
}

#[test]
fn merge_up_to_date() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend.create_branch("feature").unwrap();

    let result = backend
        .merge_branch("feature", MergeOption::Default)
        .unwrap();
    assert_eq!(result.kind, app_lib::git::types::MergeKind::UpToDate);
    assert!(result.oid.is_none());
}

#[test]
fn create_duplicate_branch_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend.create_branch("dup").unwrap();

    let result = backend.create_branch("dup");
    assert!(result.is_err());
}

#[test]
fn delete_nonexistent_branch_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let result = backend.delete_branch("nonexistent");
    assert!(result.is_err());
}

#[test]
fn list_branches_includes_remote_fields() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let branches = backend.list_branches().unwrap();
    let default = branches.iter().find(|b| b.is_head).unwrap();

    assert!(!default.is_remote);
    assert!(default.remote_name.is_none());
}

#[test]
fn list_remotes_empty_by_default() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let remotes = backend.list_remotes().unwrap();
    assert!(remotes.is_empty());
}

#[test]
fn add_and_list_remote() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    backend
        .add_remote("origin", "https://example.com/repo.git")
        .unwrap();

    let remotes = backend.list_remotes().unwrap();
    assert_eq!(remotes.len(), 1);
    assert_eq!(remotes[0].name, "origin");
    assert_eq!(remotes[0].url, "https://example.com/repo.git");
}

#[test]
fn remove_remote() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend
        .add_remote("origin", "https://example.com/repo.git")
        .unwrap();

    backend.remove_remote("origin").unwrap();

    let remotes = backend.list_remotes().unwrap();
    assert!(remotes.is_empty());
}

#[test]
fn edit_remote_url() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend
        .add_remote("origin", "https://example.com/old.git")
        .unwrap();

    backend
        .edit_remote("origin", "https://example.com/new.git")
        .unwrap();

    let remotes = backend.list_remotes().unwrap();
    assert_eq!(remotes[0].url, "https://example.com/new.git");
}

#[test]
fn add_duplicate_remote_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend
        .add_remote("origin", "https://example.com/repo.git")
        .unwrap();

    let result = backend.add_remote("origin", "https://example.com/other.git");
    assert!(result.is_err());
}

#[test]
fn remove_nonexistent_remote_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let result = backend.remove_remote("nonexistent");
    assert!(result.is_err());
}

#[test]
fn merge_ff_only_fails_when_not_possible() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let default_branch = backend.current_branch().unwrap();

    backend.create_branch("feature").unwrap();
    backend.checkout_branch("feature").unwrap();
    fs::write(tmp.path().join("feature.txt"), "feature").unwrap();
    backend.stage(Path::new("feature.txt")).unwrap();
    backend.commit("feature commit").unwrap();

    backend.checkout_branch(&default_branch).unwrap();
    fs::write(tmp.path().join("main.txt"), "main work").unwrap();
    backend.stage(Path::new("main.txt")).unwrap();
    backend.commit("main commit").unwrap();

    let result = backend.merge_branch("feature", MergeOption::FastForwardOnly);
    assert!(result.is_err());
}

#[test]
fn fetch_nonexistent_remote_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let result = backend.fetch("nonexistent");
    assert!(result.is_err());
}

#[test]
fn pull_nonexistent_remote_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let result = backend.pull("nonexistent", PullOption::Merge);
    assert!(result.is_err());
}

#[test]
fn push_nonexistent_remote_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let result = backend.push("nonexistent");
    assert!(result.is_err());
}

#[test]
fn fetch_invalid_url_remote_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    backend
        .add_remote("bad", "file:///nonexistent/path/repo.git")
        .unwrap();

    let result = backend.fetch("bad");
    assert!(result.is_err());
}
