# テスト

## 概要

Rocket のバックエンド（Rust / Tauri）には 2 種類の結合テストがある。

| テストファイル                           | 対象                                       | テスト数 |
| ---------------------------------------- | ------------------------------------------ | -------- |
| `src-tauri/tests/git2_backend_test.rs`   | `GitBackend` トレイトの `Git2Backend` 実装 | 78       |
| `src-tauri/tests/tauri_commands_test.rs` | Tauri コマンド（IPC レイヤー）             | 19       |

## 実行方法

```bash
task test:rust                # 全 Rust テスト
cargo test --manifest-path src-tauri/Cargo.toml --test tauri_commands_test  # Tauri コマンドテストのみ
cargo test --manifest-path src-tauri/Cargo.toml --test git2_backend_test   # Git2Backend テストのみ
```

## Tauri MockRuntime テスト (`tauri_commands_test.rs`)

Tauri の `tauri::test` モジュールが提供する MockRuntime を使い、IPC レイヤーを通して各コマンドの振る舞いを検証する。

### 仕組み

1. `tauri::test::mock_builder()` で MockRuntime 付きの Tauri アプリを構築
2. `AppState` に `Git2Backend`（またはリポジトリ未設定の `None`）を注入
3. `tauri::test::get_ipc_response()` で IPC リクエストを発行し、レスポンスを検証

### テスト一覧

#### Phase 1: エラーハンドリング

| テスト名                     | 検証内容                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| `test_no_repo_returns_error` | リポジトリ未設定時に `"No repository opened"` エラーが返る |

#### Phase 2: 基本 Git コマンド (`commands/git.rs`)

| テスト名                         | 検証内容                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| `test_get_status_empty_repo`     | 空リポジトリで空の `RepoStatus` が返る                      |
| `test_get_status_with_files`     | ファイル作成後に untracked ファイルが返る                   |
| `test_stage_and_unstage_file`    | `stage_file` → staged 確認 → `unstage_file` → unstaged 確認 |
| `test_stage_all_and_unstage_all` | 複数ファイルの `stage_all` / `unstage_all`                  |
| `test_commit`                    | `stage_file` → `commit` で `CommitResult.oid` が返る        |
| `test_get_current_branch`        | コミット後にブランチ名が返る                                |
| `test_get_diff`                  | 変更後の `get_diff` で `FileDiff` が返る                    |
| `test_get_head_commit_message`   | 直前のコミットメッセージが返る                              |

#### Phase 3: ブランチコマンド (`commands/branch.rs`)

| テスト名                          | 検証内容                                                   |
| --------------------------------- | ---------------------------------------------------------- |
| `test_list_branches`              | ブランチ一覧に `is_head=true` のブランチが含まれる         |
| `test_create_and_checkout_branch` | `create_branch` → `checkout_branch` → `get_current_branch` |

#### Phase 4: リモートコマンド (`commands/remote.rs`)

| テスト名                   | 検証内容                                               |
| -------------------------- | ------------------------------------------------------ |
| `test_list_remotes_empty`  | リモート未設定時に空リストが返る                       |
| `test_add_and_list_remote` | `add_remote` → `list_remotes` で追加したリモートが返る |

#### Phase 5: タグコマンド (`commands/tag.rs`)

| テスト名                   | 検証内容                                        |
| -------------------------- | ----------------------------------------------- |
| `test_list_tags_empty`     | タグ未作成時に空リストが返る                    |
| `test_create_and_list_tag` | `create_tag` → `list_tags` で作成したタグが返る |

#### Phase 6: Stash コマンド (`commands/stash.rs`)

| テスト名                  | 検証内容                       |
| ------------------------- | ------------------------------ |
| `test_list_stashes_empty` | stash 未保存時に空リストが返る |

#### Phase 7: History コマンド (`commands/history.rs`)

| テスト名              | 検証内容               |
| --------------------- | ---------------------- |
| `test_get_commit_log` | コミット後にログが返る |

#### Phase 8: Conflict コマンド (`commands/conflict.rs`)

| テスト名                | 検証内容                  |
| ----------------------- | ------------------------- |
| `test_is_merging_false` | 通常状態で `false` が返る |

#### Phase 9: Rebase コマンド (`commands/rebase.rs`)

| テスト名                 | 検証内容                  |
| ------------------------ | ------------------------- |
| `test_is_rebasing_false` | 通常状態で `false` が返る |

### ヘルパー関数

| 関数名                  | 役割                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `init_test_repo`        | `git init` + ユーザー設定                                     |
| `init_repo_with_commit` | リポジトリ初期化 + 初回コミット、`Box<dyn GitBackend>` を返す |
| `build_test_app`        | MockRuntime 付き Tauri アプリを構築（全コマンド登録済み）     |
| `build_test_webview`    | テスト用 WebviewWindow を構築                                 |
| `make_request`          | IPC リクエストを構築                                          |

## Git2Backend テスト (`git2_backend_test.rs`)

`GitBackend` トレイトの `Git2Backend` 実装を直接テストする。Tauri の IPC レイヤーを経由せず、バックエンドの振る舞いを検証する。詳細はテストファイルを参照。
