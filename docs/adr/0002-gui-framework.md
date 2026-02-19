# ADR-0002: GUIフレームワークの選定

## ステータス

承認済み (2026-02-19)

## コンテキスト

Rocketのデスクトップアプリケーション基盤となるGUIフレームワークを選定する必要がある。
ADR-0001でRustを採用したため、Rustエコシステムのフレームワークが候補となる。

要件:

- Webフロントエンド技術 (HTML/CSS/JS) でUIを構築できること
- クロスプラットフォーム (macOS / Linux / Windows) 対応
- インストーラーの自動生成が可能であること
- React (TypeScript) をフロントエンドフレームワークとして利用できること

## 決定

**Tauri v2** + **React (TypeScript)** を採用する。

## 理由

### Tauri v2

- Rustバックエンド + Webフロントエンドのアーキテクチャにより、UIの自由度が高い
- OS標準のWebView (WebKit / WebView2) を使用するため、バイナリサイズが小さい
- バンドラーが組み込まれており、各プラットフォーム向けインストーラーを自動生成できる
  - macOS: `.dmg` / `.app`
  - Windows: `.msi` / `.exe` (NSIS)
  - Linux: `.deb` / `.rpm` / `.AppImage`
- Tauri Command APIによりRustバックエンドとフロントエンド間の型安全な通信が可能
- v2が安定版としてリリース済み

### React (TypeScript)

- エコシステムが最大であり、UIコンポーネントライブラリが豊富
- Tauriの公式テンプレートでTypeScript + Reactの構成が標準サポートされている
- TypeScriptにより、Tauri Command APIのIPC呼び出しをフロントエンド側でも型安全に扱える
- 開発者の採用・学習コストが低い

## 却下した選択肢

### Dioxus

- Rust製のReactライクなフレームワークだが、エコシステムがまだ小さい
- Web技術の資産 (CSSライブラリ、UIコンポーネント) を直接活用しにくい

### Slint

- 宣言的UIだがWeb技術ベースではない
- 独自マークアップ言語の学習コストがある

### Electron + Rust (napi-rs)

- UIの自由度は最大だが、メモリ消費量とバイナリサイズが大きい
- Chromiumをバンドルするため配布サイズが100MB超になりやすい

## 影響

- フロントエンドのビルドツールチェーン (Vite等) の導入が必要
- Tauri Commandを通じたRust ↔ フロントエンド間のAPI設計が必要
