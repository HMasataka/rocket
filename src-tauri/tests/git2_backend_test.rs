use std::fs;
use std::path::Path;
use std::process::Command;

use app_lib::git::backend::GitBackend;
use app_lib::git::git2_backend::Git2Backend;
use app_lib::git::types::{
    DiffLineKind, DiffOptions, HunkIdentifier, LineRange, LogFilter, MergeOption, PullOption,
};

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

fn create_file_with_multiple_changed_lines(dir: &Path, backend: &Git2Backend) {
    fs::write(dir.join("lines.txt"), "line1\nline2\nline3\nline4\nline5\n").unwrap();
    backend.stage(Path::new("lines.txt")).unwrap();
    backend.commit("add lines", false).unwrap();
    fs::write(
        dir.join("lines.txt"),
        "line1\nchanged2\nline3\nchanged4\nline5\nnew6\n",
    )
    .unwrap();
}

fn create_file_with_two_hunks(dir: &Path, backend: &Git2Backend) {
    let mut content = String::new();
    for i in 1..=20 {
        content.push_str(&format!("line{i}\n"));
    }
    fs::write(dir.join("twohunk.txt"), &content).unwrap();
    backend.stage(Path::new("twohunk.txt")).unwrap();
    backend.commit("add twohunk", false).unwrap();
    let mut modified = String::new();
    for i in 1..=20 {
        if i == 2 {
            modified.push_str("modified2\n");
        } else if i == 18 {
            modified.push_str("modified18\n");
        } else {
            modified.push_str(&format!("line{i}\n"));
        }
    }
    fs::write(dir.join("twohunk.txt"), &modified).unwrap();
}

fn init_repo_with_commit(dir: &Path) -> Git2Backend {
    init_test_repo(dir);
    fs::write(dir.join("init.txt"), "init").unwrap();
    let backend = Git2Backend::open(dir).unwrap();
    backend.stage(Path::new("init.txt")).unwrap();
    backend.commit("initial commit", false).unwrap();
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

    let result = backend.commit("initial commit", false).unwrap();
    assert!(!result.oid.is_empty());
}

#[test]
fn current_branch_after_commit() {
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());

    fs::write(tmp.path().join("file.txt"), "data").unwrap();

    let backend = Git2Backend::open(tmp.path()).unwrap();
    backend.stage(Path::new("file.txt")).unwrap();
    backend.commit("init", false).unwrap();

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
    backend.commit("init", false).unwrap();

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
    backend.commit("init", false).unwrap();

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
    backend.commit("feature commit", false).unwrap();

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
    backend.commit("feature commit", false).unwrap();

    backend.checkout_branch(&default_branch).unwrap();
    fs::write(tmp.path().join("main.txt"), "main work").unwrap();
    backend.stage(Path::new("main.txt")).unwrap();
    backend.commit("main commit", false).unwrap();

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
    backend.commit("second commit", false).unwrap();

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
    let commit_result = backend.commit("detail commit", false).unwrap();

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
    backend.commit("add blame file", false).unwrap();

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
    let first_commit = backend.commit("first", false).unwrap();

    fs::write(tmp.path().join("multi.txt"), "original\nadded\n").unwrap();
    backend.stage(Path::new("multi.txt")).unwrap();
    backend.commit("second", false).unwrap();

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
    backend.commit("add tracked", false).unwrap();

    fs::write(tmp.path().join("other.txt"), "other").unwrap();
    backend.stage(Path::new("other.txt")).unwrap();
    backend.commit("add other", false).unwrap();

    fs::write(tmp.path().join("tracked.txt"), "v2").unwrap();
    backend.stage(Path::new("tracked.txt")).unwrap();
    backend.commit("update tracked", false).unwrap();

    let history = backend.get_file_history("tracked.txt", 100, 0).unwrap();

    assert_eq!(history.len(), 2);
    assert_eq!(history[0].message, "update tracked");
    assert_eq!(history[1].message, "add tracked");
}

#[test]
fn list_branches_has_ahead_behind_zero_without_upstream() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let branches = backend.list_branches().unwrap();
    let head = branches.iter().find(|b| b.is_head).unwrap();

    assert_eq!(head.ahead_count, 0);
    assert_eq!(head.behind_count, 0);
}

#[test]
fn get_branch_commits_returns_commits_for_branch() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    backend.create_branch("feature").unwrap();
    backend.checkout_branch("feature").unwrap();

    fs::write(tmp.path().join("feature.txt"), "feature work").unwrap();
    backend.stage(Path::new("feature.txt")).unwrap();
    backend.commit("feature commit", false).unwrap();

    let commits = backend.get_branch_commits("feature", 10).unwrap();

    assert_eq!(commits.len(), 2);
    assert_eq!(commits[0].message, "feature commit");
    assert_eq!(commits[1].message, "initial commit");
}

#[test]
fn get_branch_commits_respects_limit() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    for i in 0..5 {
        let filename = format!("file{i}.txt");
        fs::write(tmp.path().join(&filename), format!("content {i}")).unwrap();
        backend.stage(Path::new(&filename)).unwrap();
        backend.commit(&format!("commit {i}"), false).unwrap();
    }

    let branch_name = backend.current_branch().unwrap();
    let commits = backend.get_branch_commits(&branch_name, 3).unwrap();

    assert_eq!(commits.len(), 3);
}

#[test]
fn get_branch_commits_nonexistent_branch_fails() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let result = backend.get_branch_commits("nonexistent", 10);
    assert!(result.is_err());
}

#[test]
fn diff_includes_hunk_range_fields() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("file.txt"), "line1\nline2\nline3\n").unwrap();
    backend.stage(Path::new("file.txt")).unwrap();
    backend.commit("add file", false).unwrap();

    fs::write(tmp.path().join("file.txt"), "line1\nmodified\nline3\n").unwrap();

    let options = DiffOptions {
        staged: false,
        ..Default::default()
    };
    let diffs = backend.diff(Some(Path::new("file.txt")), &options).unwrap();

    assert!(!diffs.is_empty());
    let hunk = &diffs[0].hunks[0];
    assert!(hunk.old_start > 0);
    assert!(hunk.new_start > 0);
    assert!(hunk.old_lines > 0);
    assert!(hunk.new_lines > 0);
}

fn create_two_hunk_file(dir: &Path, backend: &Git2Backend) {
    let mut content = String::new();
    for i in 1..=20 {
        content.push_str(&format!("line{i}\n"));
    }
    fs::write(dir.join("multi.txt"), &content).unwrap();
    backend.stage(Path::new("multi.txt")).unwrap();
    backend.commit("add multi", false).unwrap();

    let mut modified = String::new();
    for i in 1..=20 {
        if i == 2 {
            modified.push_str("modified_top\n");
        } else if i == 19 {
            modified.push_str("modified_bottom\n");
        } else {
            modified.push_str(&format!("line{i}\n"));
        }
    }
    fs::write(dir.join("multi.txt"), &modified).unwrap();
}

#[test]
fn stage_hunk_stages_only_specified_hunk() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    create_two_hunk_file(tmp.path(), &backend);

    let options = DiffOptions {
        staged: false,
        ..Default::default()
    };
    let diffs = backend
        .diff(Some(Path::new("multi.txt")), &options)
        .unwrap();
    assert!(diffs[0].hunks.len() >= 2, "Expected at least 2 hunks");

    let first_hunk = &diffs[0].hunks[0];
    let hunk_id = app_lib::git::types::HunkIdentifier {
        old_start: first_hunk.old_start,
        old_lines: first_hunk.old_lines,
        new_start: first_hunk.new_start,
        new_lines: first_hunk.new_lines,
    };

    backend
        .stage_hunk(Path::new("multi.txt"), &hunk_id)
        .unwrap();

    let staged_diffs = backend
        .diff(
            Some(Path::new("multi.txt")),
            &DiffOptions {
                staged: true,
                ..Default::default()
            },
        )
        .unwrap();
    assert_eq!(
        staged_diffs[0].hunks.len(),
        1,
        "Only one hunk should be staged"
    );

    let unstaged_diffs = backend
        .diff(
            Some(Path::new("multi.txt")),
            &DiffOptions {
                staged: false,
                ..Default::default()
            },
        )
        .unwrap();
    assert_eq!(
        unstaged_diffs[0].hunks.len(),
        1,
        "One hunk should remain unstaged"
    );
}

#[test]
fn unstage_hunk_unstages_only_specified_hunk() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    create_two_hunk_file(tmp.path(), &backend);

    backend.stage(Path::new("multi.txt")).unwrap();

    let staged_diffs = backend
        .diff(
            Some(Path::new("multi.txt")),
            &DiffOptions {
                staged: true,
                ..Default::default()
            },
        )
        .unwrap();
    assert!(staged_diffs[0].hunks.len() >= 2);

    let first_hunk = &staged_diffs[0].hunks[0];
    let hunk_id = app_lib::git::types::HunkIdentifier {
        old_start: first_hunk.old_start,
        old_lines: first_hunk.old_lines,
        new_start: first_hunk.new_start,
        new_lines: first_hunk.new_lines,
    };

    backend
        .unstage_hunk(Path::new("multi.txt"), &hunk_id)
        .unwrap();

    let staged_after = backend
        .diff(
            Some(Path::new("multi.txt")),
            &DiffOptions {
                staged: true,
                ..Default::default()
            },
        )
        .unwrap();
    assert_eq!(
        staged_after[0].hunks.len(),
        1,
        "One hunk should remain staged"
    );
}

#[test]
fn discard_hunk_discards_only_specified_hunk() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    create_two_hunk_file(tmp.path(), &backend);

    let options = DiffOptions {
        staged: false,
        ..Default::default()
    };
    let diffs = backend
        .diff(Some(Path::new("multi.txt")), &options)
        .unwrap();
    assert!(diffs[0].hunks.len() >= 2);

    let first_hunk = &diffs[0].hunks[0];
    let hunk_id = app_lib::git::types::HunkIdentifier {
        old_start: first_hunk.old_start,
        old_lines: first_hunk.old_lines,
        new_start: first_hunk.new_start,
        new_lines: first_hunk.new_lines,
    };

    backend
        .discard_hunk(Path::new("multi.txt"), &hunk_id)
        .unwrap();

    let diffs_after = backend
        .diff(Some(Path::new("multi.txt")), &options)
        .unwrap();
    assert_eq!(
        diffs_after[0].hunks.len(),
        1,
        "One hunk should remain after discard"
    );
}

// --- Line staging tests ---

#[test]
fn stage_lines_stages_only_selected_lines() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    create_file_with_multiple_changed_lines(tmp.path(), &backend);

    let options = DiffOptions {
        staged: false,
        ..Default::default()
    };
    let diffs = backend
        .diff(Some(Path::new("lines.txt")), &options)
        .unwrap();
    assert!(!diffs.is_empty());

    let hunk = &diffs[0].hunks[0];
    let hunk_id = HunkIdentifier {
        old_start: hunk.old_start,
        old_lines: hunk.old_lines,
        new_start: hunk.new_start,
        new_lines: hunk.new_lines,
    };

    let first_add = hunk
        .lines
        .iter()
        .enumerate()
        .find(|(_, l)| l.kind == DiffLineKind::Addition)
        .map(|(i, _)| i)
        .unwrap();

    let line_range = LineRange {
        hunk: hunk_id,
        line_indices: vec![first_add],
    };
    backend
        .stage_lines(Path::new("lines.txt"), &line_range)
        .unwrap();

    let staged = backend
        .diff(
            Some(Path::new("lines.txt")),
            &DiffOptions {
                staged: true,
                ..Default::default()
            },
        )
        .unwrap();
    assert!(!staged.is_empty(), "Should have staged changes");

    let unstaged = backend
        .diff(Some(Path::new("lines.txt")), &options)
        .unwrap();
    assert!(!unstaged.is_empty(), "Should still have unstaged changes");
}

#[test]
fn unstage_lines_unstages_only_selected_lines() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    create_file_with_two_hunks(tmp.path(), &backend);

    backend.stage(Path::new("twohunk.txt")).unwrap();

    let staged_diffs = backend
        .diff(
            Some(Path::new("twohunk.txt")),
            &DiffOptions {
                staged: true,
                ..Default::default()
            },
        )
        .unwrap();
    assert!(!staged_diffs.is_empty());
    assert!(
        staged_diffs[0].hunks.len() >= 2,
        "Should have at least 2 hunks"
    );

    let hunk = &staged_diffs[0].hunks[0];
    let hunk_id = HunkIdentifier {
        old_start: hunk.old_start,
        old_lines: hunk.old_lines,
        new_start: hunk.new_start,
        new_lines: hunk.new_lines,
    };

    let del_idx = hunk
        .lines
        .iter()
        .enumerate()
        .find(|(_, l)| l.kind == DiffLineKind::Deletion)
        .map(|(i, _)| i);
    let add_idx = hunk
        .lines
        .iter()
        .enumerate()
        .find(|(_, l)| l.kind == DiffLineKind::Addition)
        .map(|(i, _)| i);

    let mut selected = Vec::new();
    if let Some(idx) = del_idx {
        selected.push(idx);
    }
    if let Some(idx) = add_idx {
        selected.push(idx);
    }

    let line_range = LineRange {
        hunk: hunk_id,
        line_indices: selected,
    };
    backend
        .unstage_lines(Path::new("twohunk.txt"), &line_range)
        .unwrap();

    let unstaged_after = backend
        .diff(
            Some(Path::new("twohunk.txt")),
            &DiffOptions {
                staged: false,
                ..Default::default()
            },
        )
        .unwrap();
    assert!(
        !unstaged_after.is_empty(),
        "Should have unstaged changes after unstage_lines"
    );
}

#[test]
fn discard_lines_discards_only_selected_lines() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    create_file_with_multiple_changed_lines(tmp.path(), &backend);

    let options = DiffOptions {
        staged: false,
        ..Default::default()
    };
    let diffs = backend
        .diff(Some(Path::new("lines.txt")), &options)
        .unwrap();
    let hunk = &diffs[0].hunks[0];
    let hunk_id = HunkIdentifier {
        old_start: hunk.old_start,
        old_lines: hunk.old_lines,
        new_start: hunk.new_start,
        new_lines: hunk.new_lines,
    };

    let mut all_indices = Vec::new();
    for (i, line) in hunk.lines.iter().enumerate() {
        if line.kind == DiffLineKind::Addition || line.kind == DiffLineKind::Deletion {
            all_indices.push(i);
        }
    }

    let line_range = LineRange {
        hunk: hunk_id,
        line_indices: all_indices,
    };
    backend
        .discard_lines(Path::new("lines.txt"), &line_range)
        .unwrap();

    let diffs_after = backend
        .diff(Some(Path::new("lines.txt")), &options)
        .unwrap();
    assert!(
        diffs_after.is_empty() || diffs_after[0].hunks.is_empty(),
        "All changes should be discarded"
    );
}

// --- Amend tests ---

#[test]
fn commit_amend_changes_message() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let msg = backend.get_head_commit_message().unwrap();
    assert_eq!(msg.trim(), "initial commit");

    backend.commit("amended message", true).unwrap();

    let msg_after = backend.get_head_commit_message().unwrap();
    assert_eq!(msg_after.trim(), "amended message");
}

#[test]
fn commit_amend_includes_new_staged_changes() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("new.txt"), "new content").unwrap();
    backend.stage(Path::new("new.txt")).unwrap();

    backend.commit("amend with new file", true).unwrap();

    let detail = backend.get_head_commit_message().unwrap();
    assert_eq!(detail.trim(), "amend with new file");
}

#[test]
fn get_head_commit_message_returns_message() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let msg = backend.get_head_commit_message().unwrap();
    assert_eq!(msg.trim(), "initial commit");
}

// === Stash tests ===

#[test]
fn stash_save_and_list() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    // Create a modification to stash
    fs::write(tmp.path().join("init.txt"), "modified").unwrap();

    backend.stash_save(Some("test stash")).unwrap();

    let stashes = backend.stash_list().unwrap();
    assert_eq!(stashes.len(), 1);
    assert_eq!(stashes[0].index, 0);
    assert!(stashes[0].message.contains("test stash"));
}

#[test]
fn stash_list_empty() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let stashes = backend.stash_list().unwrap();
    assert!(stashes.is_empty());
}

#[test]
fn stash_apply_restores_changes() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("init.txt"), "modified").unwrap();
    backend.stash_save(Some("to apply")).unwrap();

    // Working tree should be clean after stash
    let status = backend.status().unwrap();
    assert!(status.files.is_empty());

    backend.stash_apply(0).unwrap();

    // Changes should be restored
    let status = backend.status().unwrap();
    assert!(!status.files.is_empty());

    // Stash should still exist after apply
    let stashes = backend.stash_list().unwrap();
    assert_eq!(stashes.len(), 1);
}

#[test]
fn stash_pop_restores_and_removes() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("init.txt"), "modified").unwrap();
    backend.stash_save(Some("to pop")).unwrap();

    backend.stash_pop(0).unwrap();

    // Changes should be restored
    let status = backend.status().unwrap();
    assert!(!status.files.is_empty());

    // Stash should be removed after pop
    let stashes = backend.stash_list().unwrap();
    assert!(stashes.is_empty());
}

#[test]
fn stash_drop_removes_stash() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("init.txt"), "modified").unwrap();
    backend.stash_save(Some("to drop")).unwrap();

    backend.stash_drop(0).unwrap();

    let stashes = backend.stash_list().unwrap();
    assert!(stashes.is_empty());
}

#[test]
fn stash_diff_returns_file_diffs() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("init.txt"), "modified content").unwrap();
    backend.stash_save(Some("diff test")).unwrap();

    let diffs = backend.stash_diff(0).unwrap();
    assert!(!diffs.is_empty());
    assert!(diffs[0].hunks.len() > 0);
}

#[test]
fn stash_branch_name_parsed_from_message() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    fs::write(tmp.path().join("init.txt"), "modified").unwrap();
    backend.stash_save(None).unwrap();

    let stashes = backend.stash_list().unwrap();
    assert_eq!(stashes.len(), 1);
    // Default stash message is "WIP on main: ..." so branch_name should be "main"
    assert_eq!(stashes[0].branch_name, "main");
}

// === Tag tests ===

#[test]
fn list_tags_empty() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    let tags = backend.list_tags().unwrap();
    assert!(tags.is_empty());
}

#[test]
fn create_lightweight_tag_and_list() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    backend.create_tag("v0.1.0", None).unwrap();

    let tags = backend.list_tags().unwrap();
    assert_eq!(tags.len(), 1);
    assert_eq!(tags[0].name, "v0.1.0");
    assert!(!tags[0].is_annotated);
    assert!(tags[0].message.is_none());
}

#[test]
fn create_annotated_tag_and_list() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    backend.create_tag("v1.0.0", Some("Release 1.0")).unwrap();

    let tags = backend.list_tags().unwrap();
    assert_eq!(tags.len(), 1);
    assert_eq!(tags[0].name, "v1.0.0");
    assert!(tags[0].is_annotated);
    assert_eq!(tags[0].message.as_deref(), Some("Release 1.0"));
}

#[test]
fn delete_tag_removes_it() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    backend.create_tag("to-delete", None).unwrap();
    assert_eq!(backend.list_tags().unwrap().len(), 1);

    backend.delete_tag("to-delete").unwrap();
    assert!(backend.list_tags().unwrap().is_empty());
}

#[test]
fn checkout_tag_detaches_head() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    backend.create_tag("v0.1.0", None).unwrap();
    backend.checkout_tag("v0.1.0").unwrap();

    // HEAD should be detached, so current_branch returns an error or "HEAD"
    let branch = backend.current_branch();
    assert!(branch.is_err() || branch.unwrap().contains("HEAD"));
}

#[test]
fn create_multiple_tags_and_list() {
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());

    backend.create_tag("alpha", None).unwrap();
    backend.create_tag("beta", Some("Beta release")).unwrap();

    let tags = backend.list_tags().unwrap();
    assert_eq!(tags.len(), 2);

    let names: Vec<&str> = tags.iter().map(|t| t.name.as_str()).collect();
    assert!(names.contains(&"alpha"));
    assert!(names.contains(&"beta"));
}
