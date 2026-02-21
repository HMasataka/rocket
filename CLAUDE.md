# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Rocket はクロスプラットフォームの Git GUI クライアント。技術スタック: Rust + Tauri v2（バックエンド）、React + TypeScript + Vite（フロントエンド）、git2-rs + git CLI ハイブリッド（Git操作）。技術選定の詳細は `docs/adr/` を参照。

現在 **v0.1 MVP** — 基本的なコミットワークフロー（状態表示・差分表示・ステージング・コミット）が動作する。

## 開発環境

Nix flake + direnv で開発ツールチェーンを管理する。パッケージの追加・変更は `flake.nix` の `packages` に記述する。

```bash
direnv allow              # cd 時に nix devShell を自動ロード
pnpm install              # フロントエンドの依存をインストール
```

## コマンド

タスクランナーは [Task](https://taskfile.dev/)（`Taskfile.yml`）を使用。

```bash
task dev                  # Tauri アプリを開発モードで起動（ホットリロード付き）
task dev:front            # フロントエンドのみ起動（ブラウザで http://localhost:1420）
task build                # プロダクションビルド（バイナリ生成）
task test                 # 全テスト実行（Rust + フロントエンド）
task test:rust            # Rust テストのみ
task test:front           # フロントエンドテストのみ（vitest）
task lint                 # Biome でリント・フォーマットチェック
task lint:fix             # Biome で自動修正
task clippy               # Rust 静的解析
task check                # lint + clippy + test を一括実行
task designs:link         # デザインモックに遷移スクリプト注入
task designs:clean        # 注入済みスクリプトを除去
```

## アーキテクチャ

### 5層構成（ADR-0004）

```
UI Layer (React)  →  Tauri Command (IPC)  →  Application Layer  →  Domain Layer  →  Infrastructure Layer (git2-rs / git CLI)
```

依存方向は上→下の一方向。Domain Layer が GitBackend トレイトを定義し、Infrastructure Layer が実装する（依存性逆転）。

### バックエンド（Rust / `src-tauri/src/`）

- `lib.rs` — Tauri コマンド登録・AppState 初期化・プラグイン設定
- `state.rs` — `AppState { repo: Mutex<Option<Box<dyn GitBackend>>> }`
- `commands/git.rs` — Git 操作の Tauri コマンド（get_status, get_diff, stage_file, unstage_file, commit 等）
- `commands/config.rs` — 設定の読み書きコマンド
- `git/backend.rs` — `GitBackend` トレイト（抽象インターフェース）
- `git/git2_backend.rs` — git2-rs による実装
- `git/types.rs` — FileStatus, FileDiff, DiffHunk 等のシリアライズ可能な型
- `config/mod.rs` — `~/.config/rocket/config.toml` の読み書き

### フロントエンド（React / TypeScript / `src/`）（ADR-0005）

**状態管理**: Zustand。**コンポーネント設計**: Atomic Design。**IPC 通信**: Service Layer。

- `services/git.ts` — Tauri `invoke()` ラッパー + TypeScript 型定義（Rust 型と対応）
- `stores/gitStore.ts` — Git 状態（status, diff, branch）の Zustand ストア
- `stores/uiStore.ts` — UI 状態（選択ファイル、トースト通知）の Zustand ストア
- `components/` — 共有コンポーネント（atoms: Button, StatusBadge / organisms: Sidebar, Statusbar, Titlebar, ToastContainer / templates: AppShell）
- `pages/changes/` — Changes ページ（organisms: FilePanel, DiffPanel, CommitPanel / molecules: FileItem, FileSection, DiffHunk, DiffLine）

データフロー: `Component → Store action → Service → invoke() → Rust Command → GitBackend`

### コーディング規約

- **フォーマッタ/リンター**: Biome（スペース2つインデント、ダブルクォート、recommended ルール）
- **Rust**: clippy `-D warnings`
- **テスト**: フロントエンド=Vitest、Rust=cargo test（`src-tauri/tests/` に結合テスト）

### CI

- `.github/workflows/build.yml` — macOS / Linux (ubuntu-24.04) / Windows クロスプラットフォームビルド
- `.github/workflows/test.yml` — Rust テスト + clippy、フロントエンドテスト

## デザインシステム

### ページ構成

各デザインページは `designs/` 配下のディレクトリに格納:

```
designs/<page-name>/
  index.html    # HTML モックアップ
  styles.css    # ページ固有のスタイルのみ
```

### 共通 CSS (`designs/shared/`)

| ファイル            | 役割                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| `variables.css`     | CSS カスタムプロパティ（カラー、スペーシング、タイポグラフィ）                   |
| `shell.css`         | アプリシェルのレイアウト（タイトルバー、ツールバー、サイドバー、ステータスバー） |
| `components.css`    | 再利用コンポーネント（ボタン、モーダル、設定レイアウト）                         |
| `changes-view.css`  | Changes/diff ビュー（ファイルリスト、差分行、コミットパネル、AI レビュー）       |
| `settings-form.css` | 設定フォーム部品（入力欄、トグル、テーマ/カラーピッカー）                        |

すべてのダイアログ/オーバーレイページは Changes ビューを暗転した背景として使用する。Changes ビューの機能を更新したら、全ダイアログページの背景 HTML も合わせて更新すること。

### ナビゲーション (`designs/connect.json`)

CSS セレクタとページ遷移先のマッピングを定義。`connect` CLI ツールがこの設定に基づきナビゲーションスクリプトを注入する。モーダルページは `modals` 配列に列挙。

### 規約

- 紫（`--purple` / `--purple-dim`）は AI 機能のアクセントカラー
- ページ固有の `styles.css` にはそのページ固有のスタイルのみ記述 — 共通スタイルは `shared/` に置く
- 設定ページの CSS 読み込み順: `variables.css` → `shell.css` → `components.css` → `changes-view.css` → `settings-form.css` → `styles.css`
- ダイアログページの CSS 読み込み順: `variables.css` → `shell.css` → `components.css` → `changes-view.css` → `styles.css`

## ドキュメント

- `docs/features.md` — 機能仕様
- `docs/roadmap.md` — 開発ロードマップ (v0.0–v1.x+)
- `docs/design-coverage.md` — デザインカバレッジ（どの機能にモックアップがあるか）
- `docs/adr/` — アーキテクチャ決定記録（0001: Rust, 0002: Tauri v2, 0003: git2-rs ハイブリッド, 0004: 5層アーキテクチャ, 0005: フロントエンド設計）

## 言語

ドキュメントとコミットメッセージは日本語。コードと CSS クラス名は英語。
