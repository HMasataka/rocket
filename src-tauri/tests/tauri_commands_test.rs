use std::fs;
use std::path::Path;
use std::process::Command;
use std::sync::Mutex;

use app_lib::commands;
use app_lib::git::backend::GitBackend;
use app_lib::git::git2_backend::Git2Backend;
use app_lib::state::AppState;

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

fn init_repo_with_commit(dir: &Path) -> Box<dyn GitBackend> {
    init_test_repo(dir);
    fs::write(dir.join("init.txt"), "init").unwrap();
    let backend = Git2Backend::open(dir).unwrap();
    backend.stage(Path::new("init.txt")).unwrap();
    backend.commit("initial commit", false).unwrap();
    Box::new(backend)
}

fn build_test_app(state: AppState) -> tauri::App<tauri::test::MockRuntime> {
    tauri::test::mock_builder()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::git::get_status,
            commands::git::get_diff,
            commands::git::stage_file,
            commands::git::unstage_file,
            commands::git::stage_all,
            commands::git::unstage_all,
            commands::git::commit,
            commands::git::get_current_branch,
            commands::git::stage_hunk,
            commands::git::unstage_hunk,
            commands::git::discard_hunk,
            commands::git::stage_lines,
            commands::git::unstage_lines,
            commands::git::discard_lines,
            commands::git::get_head_commit_message,
            commands::config::get_config,
            commands::config::save_config,
            commands::branch::list_branches,
            commands::branch::create_branch,
            commands::branch::checkout_branch,
            commands::branch::delete_branch,
            commands::branch::rename_branch,
            commands::branch::merge_branch,
            commands::branch::get_branch_commits,
            commands::remote::fetch_remote,
            commands::remote::pull_remote,
            commands::remote::push_remote,
            commands::remote::list_remotes,
            commands::remote::add_remote,
            commands::remote::remove_remote,
            commands::remote::edit_remote,
            commands::history::get_commit_log,
            commands::history::get_commit_detail,
            commands::history::get_commit_file_diff,
            commands::history::get_blame,
            commands::history::get_file_history,
            commands::stash::stash_save,
            commands::stash::list_stashes,
            commands::stash::apply_stash,
            commands::stash::pop_stash,
            commands::stash::drop_stash,
            commands::stash::get_stash_diff,
            commands::tag::list_tags,
            commands::tag::create_tag,
            commands::tag::delete_tag,
            commands::tag::checkout_tag,
            commands::conflict::get_conflict_files,
            commands::conflict::resolve_conflict,
            commands::conflict::resolve_conflict_block,
            commands::conflict::mark_resolved,
            commands::conflict::abort_merge,
            commands::conflict::continue_merge,
            commands::conflict::is_merging,
            commands::rebase::rebase,
            commands::rebase::interactive_rebase,
            commands::rebase::is_rebasing,
            commands::rebase::abort_rebase,
            commands::rebase::continue_rebase,
            commands::rebase::get_rebase_state,
            commands::rebase::get_rebase_todo,
            commands::rebase::get_merge_base_content,
        ])
        .build(tauri::generate_context!())
        .unwrap()
}

fn build_test_webview(
    app: &tauri::App<tauri::test::MockRuntime>,
) -> tauri::WebviewWindow<tauri::test::MockRuntime> {
    tauri::WebviewWindowBuilder::new(app, "main", Default::default())
        .build()
        .unwrap()
}

fn make_request(cmd: &str, body: serde_json::Value) -> tauri::webview::InvokeRequest {
    tauri::webview::InvokeRequest {
        cmd: cmd.into(),
        callback: tauri::ipc::CallbackFn(0),
        error: tauri::ipc::CallbackFn(1),
        url: "http://tauri.localhost".parse().unwrap(),
        body: tauri::ipc::InvokeBody::Json(body),
        headers: Default::default(),
        invoke_key: tauri::test::INVOKE_KEY.into(),
    }
}

// === Phase 1: エラーハンドリング ===

#[test]
fn test_no_repo_returns_error() {
    // Given: AppState with no repository
    let state = AppState {
        repo: Mutex::new(None),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: get_status is called
    let request = make_request("get_status", serde_json::json!({}));
    let response = tauri::test::get_ipc_response(&webview, request);

    // Then: error containing "No repository opened"
    let err = response.expect_err("should return error when no repo is opened");
    let err_str = err.to_string();
    assert!(
        err_str.contains("No repository opened"),
        "Expected 'No repository opened', got: {err_str}"
    );
}

// === Phase 2: 基本 Git コマンド (git.rs) ===

#[test]
fn test_get_status_empty_repo() {
    // Given: an empty repository
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());
    let backend = Git2Backend::open(tmp.path()).unwrap();
    let state = AppState {
        repo: Mutex::new(Some(Box::new(backend))),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: get_status is called
    let request = make_request("get_status", serde_json::json!({}));
    let response = tauri::test::get_ipc_response(&webview, request);

    // Then: empty files list
    let body = response.expect("get_status should succeed");
    let status = body
        .deserialize::<app_lib::git::types::RepoStatus>()
        .expect("should deserialize RepoStatus");
    assert!(status.files.is_empty());
}

#[test]
fn test_get_status_with_files() {
    // Given: a repository with an untracked file
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());
    fs::write(tmp.path().join("hello.txt"), "hello").unwrap();
    let backend = Git2Backend::open(tmp.path()).unwrap();
    let state = AppState {
        repo: Mutex::new(Some(Box::new(backend))),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: get_status is called
    let request = make_request("get_status", serde_json::json!({}));
    let response = tauri::test::get_ipc_response(&webview, request);

    // Then: one untracked file
    let body = response.expect("get_status should succeed");
    let status = body
        .deserialize::<app_lib::git::types::RepoStatus>()
        .expect("should deserialize RepoStatus");
    assert_eq!(status.files.len(), 1);
    assert_eq!(status.files[0].path, "hello.txt");
}

#[test]
fn test_stage_and_unstage_file() {
    // Given: a repository with an untracked file
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());
    fs::write(tmp.path().join("a.txt"), "content").unwrap();
    let backend = Git2Backend::open(tmp.path()).unwrap();
    let state = AppState {
        repo: Mutex::new(Some(Box::new(backend))),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: stage_file is called
    let request = make_request("stage_file", serde_json::json!({ "path": "a.txt" }));
    tauri::test::get_ipc_response(&webview, request).expect("stage_file should succeed");

    // Then: file is staged
    let request = make_request("get_status", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request).expect("get_status should succeed");
    let status = body
        .deserialize::<app_lib::git::types::RepoStatus>()
        .unwrap();
    assert!(status
        .files
        .iter()
        .any(|f| f.path == "a.txt" && f.staging == app_lib::git::types::StagingState::Staged));

    // When: unstage_file is called
    let request = make_request("unstage_file", serde_json::json!({ "path": "a.txt" }));
    tauri::test::get_ipc_response(&webview, request).expect("unstage_file should succeed");

    // Then: file is unstaged
    let request = make_request("get_status", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request).expect("get_status should succeed");
    let status = body
        .deserialize::<app_lib::git::types::RepoStatus>()
        .unwrap();
    assert!(status
        .files
        .iter()
        .all(|f| f.staging == app_lib::git::types::StagingState::Unstaged));
}

#[test]
fn test_stage_all_and_unstage_all() {
    // Given: a repository with multiple untracked files
    let tmp = tempfile::tempdir().unwrap();
    init_test_repo(tmp.path());
    fs::write(tmp.path().join("a.txt"), "a").unwrap();
    fs::write(tmp.path().join("b.txt"), "b").unwrap();
    let backend = Git2Backend::open(tmp.path()).unwrap();
    let state = AppState {
        repo: Mutex::new(Some(Box::new(backend))),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: stage_all is called
    let request = make_request("stage_all", serde_json::json!({}));
    tauri::test::get_ipc_response(&webview, request).expect("stage_all should succeed");

    // Then: all files are staged
    let request = make_request("get_status", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request).expect("get_status should succeed");
    let status = body
        .deserialize::<app_lib::git::types::RepoStatus>()
        .unwrap();
    assert!(status
        .files
        .iter()
        .all(|f| f.staging == app_lib::git::types::StagingState::Staged));

    // When: unstage_all is called
    let request = make_request("unstage_all", serde_json::json!({}));
    tauri::test::get_ipc_response(&webview, request).expect("unstage_all should succeed");

    // Then: all files are unstaged
    let request = make_request("get_status", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request).expect("get_status should succeed");
    let status = body
        .deserialize::<app_lib::git::types::RepoStatus>()
        .unwrap();
    assert!(status
        .files
        .iter()
        .all(|f| f.staging == app_lib::git::types::StagingState::Unstaged));
}

#[test]
fn test_commit() {
    // Given: a repository with a staged file
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    fs::write(tmp.path().join("new.txt"), "new content").unwrap();
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    let request = make_request("stage_file", serde_json::json!({ "path": "new.txt" }));
    tauri::test::get_ipc_response(&webview, request).expect("stage_file should succeed");

    // When: commit is called
    let request = make_request(
        "commit",
        serde_json::json!({ "message": "test commit", "amend": false }),
    );
    let body = tauri::test::get_ipc_response(&webview, request).expect("commit should succeed");

    // Then: CommitResult with non-empty oid
    let result = body
        .deserialize::<app_lib::git::types::CommitResult>()
        .expect("should deserialize CommitResult");
    assert!(!result.oid.is_empty());
}

#[test]
fn test_get_current_branch() {
    // Given: a repository with at least one commit
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: get_current_branch is called
    let request = make_request("get_current_branch", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request)
        .expect("get_current_branch should succeed");

    // Then: non-empty branch name
    let branch = body
        .deserialize::<String>()
        .expect("should deserialize branch name");
    assert!(!branch.is_empty());
}

#[test]
fn test_get_diff() {
    // Given: a repository with modified file
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    fs::write(tmp.path().join("init.txt"), "modified content").unwrap();
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: get_diff is called for unstaged changes
    let request = make_request(
        "get_diff",
        serde_json::json!({ "path": "init.txt", "staged": false }),
    );
    let body = tauri::test::get_ipc_response(&webview, request).expect("get_diff should succeed");

    // Then: non-empty FileDiff result
    let diffs = body
        .deserialize::<Vec<app_lib::git::types::FileDiff>>()
        .expect("should deserialize Vec<FileDiff>");
    assert!(!diffs.is_empty());
    assert!(!diffs[0].hunks.is_empty());
}

#[test]
fn test_get_head_commit_message() {
    // Given: a repository with a commit
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: get_head_commit_message is called
    let request = make_request("get_head_commit_message", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request)
        .expect("get_head_commit_message should succeed");

    // Then: message matches the initial commit
    let message = body
        .deserialize::<String>()
        .expect("should deserialize commit message");
    assert_eq!(message.trim(), "initial commit");
}

// === Phase 3: ブランチコマンド (branch.rs) ===

#[test]
fn test_list_branches() {
    // Given: a repository with at least one commit
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: list_branches is called
    let request = make_request("list_branches", serde_json::json!({}));
    let body =
        tauri::test::get_ipc_response(&webview, request).expect("list_branches should succeed");

    // Then: at least one branch with is_head=true
    let branches = body
        .deserialize::<Vec<app_lib::git::types::BranchInfo>>()
        .expect("should deserialize branches");
    assert!(!branches.is_empty());
    assert!(branches.iter().any(|b| b.is_head));
}

#[test]
fn test_create_and_checkout_branch() {
    // Given: a repository with at least one commit
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: create_branch is called
    let request = make_request("create_branch", serde_json::json!({ "name": "feature" }));
    tauri::test::get_ipc_response(&webview, request).expect("create_branch should succeed");

    // When: checkout_branch is called
    let request = make_request("checkout_branch", serde_json::json!({ "name": "feature" }));
    tauri::test::get_ipc_response(&webview, request).expect("checkout_branch should succeed");

    // Then: current branch is "feature"
    let request = make_request("get_current_branch", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request)
        .expect("get_current_branch should succeed");
    let branch = body
        .deserialize::<String>()
        .expect("should deserialize branch name");
    assert_eq!(branch, "feature");
}

// === Phase 4: リモートコマンド (remote.rs) ===

#[test]
fn test_list_remotes_empty() {
    // Given: a repository with no remotes
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: list_remotes is called
    let request = make_request("list_remotes", serde_json::json!({}));
    let body =
        tauri::test::get_ipc_response(&webview, request).expect("list_remotes should succeed");

    // Then: empty list
    let remotes = body
        .deserialize::<Vec<app_lib::git::types::RemoteInfo>>()
        .expect("should deserialize remotes");
    assert!(remotes.is_empty());
}

#[test]
fn test_add_and_list_remote() {
    // Given: a repository with no remotes
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: add_remote is called
    let request = make_request(
        "add_remote",
        serde_json::json!({ "name": "origin", "url": "https://example.com/repo.git" }),
    );
    tauri::test::get_ipc_response(&webview, request).expect("add_remote should succeed");

    // Then: list_remotes returns the added remote
    let request = make_request("list_remotes", serde_json::json!({}));
    let body =
        tauri::test::get_ipc_response(&webview, request).expect("list_remotes should succeed");
    let remotes = body
        .deserialize::<Vec<app_lib::git::types::RemoteInfo>>()
        .expect("should deserialize remotes");
    assert_eq!(remotes.len(), 1);
    assert_eq!(remotes[0].name, "origin");
    assert_eq!(remotes[0].url, "https://example.com/repo.git");
}

// === Phase 5: タグコマンド (tag.rs) ===

#[test]
fn test_list_tags_empty() {
    // Given: a repository with no tags
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: list_tags is called
    let request = make_request("list_tags", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request).expect("list_tags should succeed");

    // Then: empty list
    let tags = body
        .deserialize::<Vec<app_lib::git::types::TagInfo>>()
        .expect("should deserialize tags");
    assert!(tags.is_empty());
}

#[test]
fn test_create_and_list_tag() {
    // Given: a repository with at least one commit
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: create_tag is called
    let request = make_request(
        "create_tag",
        serde_json::json!({ "name": "v0.1.0", "message": null }),
    );
    tauri::test::get_ipc_response(&webview, request).expect("create_tag should succeed");

    // Then: list_tags returns the created tag
    let request = make_request("list_tags", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request).expect("list_tags should succeed");
    let tags = body
        .deserialize::<Vec<app_lib::git::types::TagInfo>>()
        .expect("should deserialize tags");
    assert_eq!(tags.len(), 1);
    assert_eq!(tags[0].name, "v0.1.0");
}

// === Phase 6: Stash コマンド (stash.rs) ===

#[test]
fn test_list_stashes_empty() {
    // Given: a repository with no stashes
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: list_stashes is called
    let request = make_request("list_stashes", serde_json::json!({}));
    let body =
        tauri::test::get_ipc_response(&webview, request).expect("list_stashes should succeed");

    // Then: empty list
    let stashes = body
        .deserialize::<Vec<app_lib::git::types::StashEntry>>()
        .expect("should deserialize stashes");
    assert!(stashes.is_empty());
}

// === Phase 7: History コマンド (history.rs) ===

#[test]
fn test_get_commit_log() {
    // Given: a repository with commits
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: get_commit_log is called
    let request = make_request(
        "get_commit_log",
        serde_json::json!({
            "filter": {
                "author": null,
                "since": null,
                "until": null,
                "message": null,
                "path": null
            },
            "limit": 100,
            "skip": 0
        }),
    );
    let body =
        tauri::test::get_ipc_response(&webview, request).expect("get_commit_log should succeed");

    // Then: at least one commit in the log
    let log = body
        .deserialize::<app_lib::git::types::CommitLogResult>()
        .expect("should deserialize CommitLogResult");
    assert!(!log.commits.is_empty());
    assert_eq!(log.commits[0].message, "initial commit");
}

// === Phase 8: Conflict コマンド (conflict.rs) ===

#[test]
fn test_is_merging_false() {
    // Given: a repository in normal state
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: is_merging is called
    let request = make_request("is_merging", serde_json::json!({}));
    let body = tauri::test::get_ipc_response(&webview, request).expect("is_merging should succeed");

    // Then: false
    let is_merging = body.deserialize::<bool>().expect("should deserialize bool");
    assert!(!is_merging);
}

// === Phase 9: Rebase コマンド (rebase.rs) ===

#[test]
fn test_is_rebasing_false() {
    // Given: a repository in normal state
    let tmp = tempfile::tempdir().unwrap();
    let backend = init_repo_with_commit(tmp.path());
    let state = AppState {
        repo: Mutex::new(Some(backend)),
        watcher: Mutex::new(None),
    };
    let app = build_test_app(state);
    let webview = build_test_webview(&app);

    // When: is_rebasing is called
    let request = make_request("is_rebasing", serde_json::json!({}));
    let body =
        tauri::test::get_ipc_response(&webview, request).expect("is_rebasing should succeed");

    // Then: false
    let is_rebasing = body.deserialize::<bool>().expect("should deserialize bool");
    assert!(!is_rebasing);
}
