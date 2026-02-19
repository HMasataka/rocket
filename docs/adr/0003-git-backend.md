# ADR-0003: Gitバックエンドの選定

## ステータス

承認済み (2026-02-19)

## コンテキスト

RocketのGit操作バックエンドを選定する必要がある。
ADR-0001でRustを採用したため、以下の3つが候補となる。

1. **gitoxide (gix)** - Pure Rust製Git実装
2. **git2-rs** - C製libgit2のRustバインディング
3. **git CLI直接実行** - `std::process::Command` でgitコマンドをラップ

## 決定

**git2-rs をメインバックエンド + git CLI をフォールバック** のハイブリッド構成を採用する。

`GitBackend` トレイトで抽象化し、操作ごとにgit2-rsまたはgit CLIにディスパッチする。

## 理由

### git2-rs をメインにする理由

- 機能カバレッジが95%と高い (clone / commit / branch / merge / rebase / stash / tag / blame / log / diff / push / pull / fetch / cherry-pick / reflog / submodule / worktree)
- gitui (TUI Git client) が同じアプローチで大規模リポジトリ (Linuxカーネル) での性能を実証済み
- インプロセス実行により、高頻度の操作 (status, diff表示等) でプロセス起動オーバーヘッドがゼロ
- Rustの型安全なAPIでエラーハンドリングが堅牢
- libgit2をスタティックリンクするため、シングルバイナリとして配布可能 (利用者にCコンパイラは不要)

### git CLI をフォールバックにする理由

- interactive rebaseはgit2-rsでは実現不可能
- GPG署名コミットの完全対応にはgit CLIが最も確実
- credential helperの完全互換性 (Git Credential Manager等) はgit CLIが最強
- ユーザー固有の `.gitconfig` 設定の完全反映にはgit CLIが必要

### アーキテクチャ

```text
Tauri Frontend (React)
        |
   Tauri Command
        |
  GitBackend trait  <--- 抽象化レイヤー
   /          \
git2-rs       git CLI
(メイン)      (フォールバック)
```

## 却下した選択肢

### gitoxide (gix) をメインにする案

- rebase / stash / cherry-pick / reflog が未実装であり、Git GUIクライアントの必須機能に致命的な欠落がある
- APIが0.x系で不安定、破壊的変更が頻繁に発生する
- 将来的に成熟すれば移行候補になりうる (トレイトの実装を差し替えるだけで対応可能)

### git CLI のみで構成する案

- GitKraken / GitHub Desktop等の実績はあるが、高頻度のAPI呼び出しでプロセス起動オーバーヘッドが蓄積する
- 出力のパースが必要でエラーハンドリングが煩雑
- Tauriとの統合で型安全性を活かしにくい

### git2-rs のみで構成する案

- interactive rebase等を独自実装する必要があり、開発コストが高い

## 影響

- `GitBackend` トレイトの設計が初期アーキテクチャの重要タスクとなる
- git CLIへのフォールバックがあるため、ユーザーのマシンにgitがインストールされていることが前提条件となる (Git GUIクライアントのユーザーとして現実的な前提)
- 将来のgitoxide移行パスを確保するため、トレイト境界の設計を慎重に行う
