use std::fs;
use std::path::Path;
use std::process::Command;

use app_lib::git::backend::GitBackend;
use app_lib::git::git2_backend::Git2Backend;
use app_lib::git::types::DiffOptions;

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
