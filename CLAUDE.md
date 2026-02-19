# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Rocket はクロスプラットフォームの Git GUI クライアント。技術スタック: Rust + Tauri v2（バックエンド）、React + TypeScript + Vite（フロントエンド）、git2-rs + git CLI ハイブリッド（Git操作）。技術選定の詳細は `docs/adr/` を参照。

現在 **デザインフェーズ (v0.0)** — プロダクションコードはまだない。リポジトリには UI/UX モックアップとドキュメントのみ。

## 開発環境

Nix flake + direnv で開発ツールチェーンを管理する。パッケージの追加・変更は `flake.nix` の `packages` に記述する。

```bash
direnv allow              # cd 時に nix devShell を自動ロード
pnpm install              # フロントエンドの依存をインストール
```

## コマンド

```bash
# Tauri アプリを開発モードで起動（ホットリロード付き）
cargo tauri dev

# フロントエンドのみ起動（ブラウザで http://localhost:1420 で確認）
pnpm dev

# フロントエンドビルド（TypeScript チェック + Vite ビルド）
pnpm build

# プロダクションビルド（バイナリ生成）
cargo tauri build

# デザインモックアップにページ遷移スクリプトを注入
task designs:link         # designs-linked/ へ出力
task designs:clean        # 注入済みスクリプトを除去
```

## アーキテクチャ

```
src/                  # React フロントエンド (TypeScript)
src-tauri/            # Rust バックエンド (Tauri v2)
  src/lib.rs          # Tauri コマンド・プラグイン登録
  src/main.rs         # エントリポイント
  tauri.conf.json     # Tauri 設定 (identifier: com.github.hmasataka.rocket)
  Cargo.toml          # Rust 依存管理
designs/              # HTML/CSS デザインモックアップ（ページ単位）
designs-linked/       # connect CLI で遷移スクリプト注入済み出力（gitignore）
docs/                 # 機能仕様・ロードマップ・ADR
```

目標レイヤー構成（`docs/roadmap.md` に記載）:

```
UI Layer (React / Tauri)  →  Tauri Command (IPC Bridge)  →  Application Layer  →  Domain Layer  →  Infrastructure Layer (git2-rs / git CLI / LLM CLI)
```

CI は GitHub Actions で macOS / Linux (ubuntu-24.04) / Windows のクロスプラットフォームビルドを実行（`.github/workflows/build.yml`）。

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
- `docs/adr/` — アーキテクチャ決定記録（Rust, Tauri v2, git2-rs ハイブリッド）

## 言語

ドキュメントとコミットメッセージは日本語。コードと CSS クラス名は英語。
