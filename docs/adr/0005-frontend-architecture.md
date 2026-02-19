# ADR-0005: フロントエンドアーキテクチャ

## ステータス

承認済み (2026-02-19)

## コンテキスト

ADR-0004 で5層構成を決定し、UI Layer の責務は「画面描画、ユーザー入力の受付、状態管理」と定義された。
UI Layer 内部のコンポーネント設計、状態管理、Tauri IPC との通信パターンを決定する必要がある。

Git GUI クライアントとして、以下の特性を考慮する:

- 画面数は中規模（Changes、History、Branches、Settings 等）
- 各画面内のコンポーネントは複雑（差分ビュー、ファイルツリー、コミットグラフ等）
- バックエンドとの通信はローカル IPC（ネットワーク遅延なし）
- Rust 側からのイベント通知（ファイル変更検知等）がある

## 決定

### 状態管理: Zustand

**Zustand** をグローバル状態管理ライブラリとして採用する。

### コンポーネント設計: Atomic Design

**Atomic Design** を採用し、ページ固有コンポーネントと共通コンポーネントを分離する。

### Tauri IPC 通信: Service Layer + Zustand

**Service Layer** に `invoke()` ラッパーを集約し、Zustand Store のアクションから呼び出す。

### ディレクトリ構成

```text
src/
  pages/                    # ページ単位のディレクトリ
    changes/
      index.tsx             # ページコンポーネント
      organisms/            # ページ固有の organisms
        FileList.tsx
        DiffViewer.tsx
      molecules/            # ページ固有の molecules
        FileListItem.tsx
      atoms/                # ページ固有の atoms（稀）
    history/
      index.tsx
      organisms/
        CommitGraph.tsx
  components/               # 共通コンポーネント（複数ページで使用）
    atoms/
      Button.tsx
      Icon.tsx
    molecules/
      SearchInput.tsx
    organisms/
      Sidebar.tsx
      Toolbar.tsx
    templates/
      AppShell.tsx          # タイトルバー + サイドバー + メインエリア
  services/                 # Tauri IPC ラッパー（invoke() の一元管理）
    git.ts                  # Git 操作の IPC 呼び出し
    settings.ts             # 設定の IPC 呼び出し
  stores/                   # Zustand Store
    gitStore.ts             # Git 状態（status, diff, branches 等）
    uiStore.ts              # UI 状態（選択中ファイル、表示モード等）
    settingsStore.ts        # 設定状態
```

### 通信フロー

```text
Component → Zustand Store (action) → Service → invoke() → Tauri Command (Rust)
                ↑                                               |
                └── set() で state 更新 ←───────── レスポンス ──┘

Rust → Tauri Event (listen) → Store の action を呼び出し → state 更新 → Component 再描画
```

## 理由

### Zustand を採用する理由

- **軽量** — バンドルサイズが約 1KB と小さく、Tauri アプリのサイズ方針に合致
- **ボイラープレートが少ない** — Redux と比較してストア定義が簡潔
- **React 外からアクセス可能** — `getState()` で Tauri の `listen()` コールバック内から直接 Store を更新できる
- **セレクタによる再描画最適化** — コンポーネントが必要なスライスのみを購読し、不要な再描画を防止

### Atomic Design を採用する理由

- **コンポーネントの粒度が明確** — atoms / molecules / organisms / templates の分類により、再利用性と責務の境界が明確
- **ページ固有と共通の分離** — `pages/<page>/` 配下にページ固有コンポーネントを置き、複数ページで使われるものだけ `components/` に昇格させることで、不要な抽象化を防止
- **デザインモックアップとの対応** — `designs/` のモックアップ構造とコンポーネント構造を対応させやすい

### Service Layer を採用する理由

- **IPC 呼び出しの一元管理** — `invoke()` の呼び出し箇所が `services/` に集約され、型定義やエラー変換が一箇所で管理できる
- **テスタビリティ** — Service をモックすることで、Store のロジックを IPC なしでテスト可能
- **将来の TanStack Query 導入に対応** — v0.13 以降の GitHub API 連携で必要になった場合、Service の呼び出し元を Query に差し替えるだけで対応可能

## 却下した選択肢

### Redux / Redux Toolkit

- Git GUI の状態管理には過剰なボイラープレート
- Action / Reducer / Slice の分離が本プロジェクトの規模に対してオーバーエンジニアリング
- Tauri Event からの Store 更新に追加の middleware が必要

### Jotai / Recoil（アトミック状態管理）

- 個々の状態を atom として管理する設計は、Git 状態のように関連する値が多いケースでは atom 間の依存管理が複雑になる
- Store 単位でまとめて管理する Zustand の方が Git GUI の状態モデルに合致

### TanStack Query をメインのデータ取得に使用

- Tauri IPC はローカル通信のため、ネットワーク向けのキャッシュ戦略（stale-while-revalidate、retry 等）の恩恵が薄い
- Zustand Store の state がキャッシュとして機能し、Tauri Event による無効化で十分
- GitHub API 連携（v0.13）で必要になった時点で部分導入する

### Zustand Store から直接 invoke() を呼び出す

- IPC 呼び出しが複数の Store に散らばり、型定義やエラーハンドリングが重複する
- Service Layer を挟むことで IPC の関心事を分離し、テスタビリティも向上する

## 影響

- フロントエンドの依存パッケージに `zustand` を追加
- ページ固有コンポーネントが複数ページで必要になった時点で `components/` に移動する運用ルールを設ける
- Service の関数シグネチャは Tauri Command の型定義と一致させ、型安全性を維持する
- ADR-0004 の「UI Layer の状態管理はフロントエンド内で完結」の原則に従い、Zustand Store がバックエンドの状態を保持しない（常に IPC 経由で最新を取得）
