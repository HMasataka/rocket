use std::fs;
use std::path::Path;
use std::process::Command;

use app_lib::git::backend::GitBackend;
use app_lib::git::git2_backend::Git2Backend;
use app_lib::git::types::{DiffOptions, LogFilter, MergeOption, PullOption};

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

#[test]
fn get_commit_log_returns_commits() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("second.txt"), "second").unwrap();
    backend.stage(Path::new("second.txt")).unwrap();
    backend.commit("second commit").unwrap();

    let filter = LogFilter {
        author: None,
        since: None,
        until: None,
        message: None,
        path: None,
    };
    let result = backend.get_commit_log(&filter, 100, 0).unwrap();

    assert_eq!(result.commits.len(), 2);
    assert_eq!(result.commits[0].message, "second commit");
    assert_eq!(result.commits[1].message, "initial commit");
}

#[test]
fn get_commit_log_filters_by_author() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let filter = LogFilter {
        author: Some("Test User".to_string()),
        since: None,
        until: None,
        message: None,
        path: None,
    };
    let result = backend.get_commit_log(&filter, 100, 0).unwrap();

    assert_eq!(result.commits.len(), 1);

    let filter_no_match = LogFilter {
        author: Some("Nonexistent".to_string()),
        since: None,
        until: None,
        message: None,
        path: None,
    };
    let result = backend.get_commit_log(&filter_no_match, 100, 0).unwrap();

    assert!(result.commits.is_empty());
}

#[test]
fn get_commit_detail_returns_info_and_files() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("detail.txt"), "detail content").unwrap();
    backend.stage(Path::new("detail.txt")).unwrap();
    let commit_result = backend.commit("detail commit").unwrap();

    let detail = backend.get_commit_detail(&commit_result.oid).unwrap();

    assert_eq!(detail.info.message, "detail commit");
    assert_eq!(detail.files.len(), 1);
    assert_eq!(detail.files[0].path, "detail.txt");
    assert_eq!(detail.stats.files_changed, 1);
}

#[test]
fn get_commit_detail_invalid_oid_returns_error() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let result = backend.get_commit_detail("invalid_oid");

    assert!(result.is_err());
}

#[test]
fn get_blame_returns_correct_line_count() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    let content = "line1\nline2\nline3\nline4\nline5\n";
    fs::write(tmp.path().join("blame.txt"), content).unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();
    backend.stage(Path::new("blame.txt")).unwrap();
    backend.commit("add blame file").unwrap();

    let blame_result = backend.get_blame("blame.txt", None).unwrap();

    assert_eq!(blame_result.path, "blame.txt");
    assert_eq!(blame_result.lines.len(), 5);

    for (i, line) in blame_result.lines.iter().enumerate() {
        assert_eq!(line.line_number, (i + 1) as u32);
    }

    assert_eq!(blame_result.lines[0].content, "line1");
    assert_eq!(blame_result.lines[4].content, "line5");
}

#[test]
fn get_blame_with_multiple_commits_tracks_authors() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("multi.txt"), "original\n").unwrap();
    let backend = Git2Backend::open(tmp.path()).unwrap();
    backend.stage(Path::new("multi.txt")).unwrap();
    let first_commit = backend.commit("first").unwrap();

    fs::write(tmp.path().join("multi.txt"), "original\nadded\n").unwrap();
    backend.stage(Path::new("multi.txt")).unwrap();
    backend.commit("second").unwrap();

    let blame_result = backend.get_blame("multi.txt", None).unwrap();

    assert_eq!(blame_result.lines.len(), 2);
    assert_eq!(blame_result.lines[0].commit_oid, first_commit.oid);
    assert_eq!(blame_result.lines[0].content, "original");
    assert_eq!(blame_result.lines[1].content, "added");
}

#[test]
fn get_file_history_returns_only_touching_commits() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("tracked.txt"), "v1").unwrap();
    backend.stage(Path::new("tracked.txt")).unwrap();
    backend.commit("add tracked").unwrap();

    fs::write(tmp.path().join("other.txt"), "other").unwrap();
    backend.stage(Path::new("other.txt")).unwrap();
    backend.commit("add other").unwrap();

    fs::write(tmp.path().join("tracked.txt"), "v2").unwrap();
    backend.stage(Path::new("tracked.txt")).unwrap();
    backend.commit("update tracked").unwrap();

    let history = backend.get_file_history("tracked.txt", 100, 0).unwrap();

    assert_eq!(history.len(), 2);
    assert_eq!(history[0].message, "update tracked");
    assert_eq!(history[1].message, "add tracked");
}
