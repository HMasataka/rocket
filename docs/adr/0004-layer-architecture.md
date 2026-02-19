# ADR-0004: レイヤー分離方針

## ステータス

承認済み (2026-02-19)

## コンテキスト

Rocket は Tauri v2 (Rust) + React (TypeScript) 構成であり、フロントエンドとバックエンドの責務分離が必要である。
ADR-0003 で GitBackend トレイトによる Git 操作の抽象化が決定済みであり、Infrastructure Layer の設計方針は確立されている。

今後の機能拡張（AI連携、GitHub/GitLab連携等）に備え、スケーラブルなレイヤー分離方針を確定する必要がある。

## 決定

以下の **5層構成** を採用する。依存方向は上から下への一方向とし、下位層は上位層に依存しない。

```text
┌─────────────────────────────────┐
│     UI Layer (React / Tauri)    │  ← Webフロントエンド
├─────────────────────────────────┤
│   Tauri Command (IPC Bridge)    │  ← Rust ↔ フロントエンド通信
├─────────────────────────────────┤
│        Application Layer        │  ← ユースケース・ワークフロー
├─────────────────────────────────┤
│         Domain Layer            │  ← Git操作のビジネスロジック
├─────────────────────────────────┤
│      Infrastructure Layer       │  ← git2-rs / git CLI / LLM CLI
└─────────────────────────────────┘
```

### 各層の責務

| 層                   | 責務                                                | 実装技術             |
| -------------------- | --------------------------------------------------- | -------------------- |
| UI Layer             | 画面描画、ユーザー入力の受付、状態管理              | React, TypeScript    |
| Tauri Command        | IPC ブリッジ、リクエスト/レスポンスの型変換         | Tauri v2 Command API |
| Application Layer    | ユースケースの実行、複数ドメイン操作の調整          | Rust                 |
| Domain Layer         | Git 操作のビジネスロジック、ドメインモデル定義      | Rust                 |
| Infrastructure Layer | 外部システムとの通信（git2-rs / git CLI / LLM CLI） | Rust, git2-rs        |

### 層間のルール

1. **依存方向は上→下の一方向** — 下位層は上位層を参照しない
2. **層をスキップしない** — UI Layer から直接 Infrastructure Layer を呼び出さない
3. **Infrastructure Layer はトレイトで抽象化** — Domain Layer が定義するトレイト（例: `GitBackend`）を Infrastructure Layer が実装する（依存性逆転）
4. **Tauri Command は薄く保つ** — IPC ブリッジとしての型変換・エラー変換のみを担当し、ビジネスロジックを持たない
5. **UI Layer の状態管理はフロントエンド内で完結** — バックエンドはステートレスに保つ

## 理由

### 5層構成を採用する理由

- **Tauri v2 のアーキテクチャに自然に適合** — Tauri Command が IPC ブリッジとして既に存在するため、これを独立した層として扱うことで責務が明確になる
- **テスタビリティの向上** — 各層を独立してテスト可能。特に Infrastructure Layer をトレイトで抽象化することで、モックによるユニットテストが容易になる
- **段階的な機能追加に適している** — ロードマップの各フェーズ（v0.1〜v1.x）で機能を追加する際、影響範囲を特定の層に限定できる
- **AI連携の拡張に対応** — v0.10以降の LLM CLI アダプターを Infrastructure Layer に追加する際、上位層への影響を最小化できる

### 依存性逆転を採用する理由

- Domain Layer がトレイトを定義し、Infrastructure Layer が実装する構成により、ドメインロジックが外部ライブラリ（git2-rs等）に依存しない
- ADR-0003 で決定した `GitBackend` トレイトがこのパターンの実証例となっている
- 将来の gitoxide 移行時にも Domain Layer の変更が不要

## 却下した選択肢

### 3層構成（UI / Command / Git）

- Tauri Command に Application Layer と Domain Layer の責務を混在させる構成
- 小規模なうちは十分だが、AI連携やGitHub連携の追加時に Command 層が肥大化する
- テストの粒度が粗くなり、ユニットテストが困難

### Hexagonal Architecture（ポート＆アダプター）

- ポートとアダプターの概念は有用だが、Tauri v2 の IPC ブリッジが既にアダプターの役割を果たしている
- 完全な Hexagonal Architecture は本プロジェクトの規模に対してオーバーエンジニアリング
- 依存性逆転の原則は採用しつつ、Tauri のアーキテクチャに合わせた5層構成の方が実用的

### Tauri Command を Application Layer に統合する4層構成

- Tauri Command と Application Layer を統合すると、IPC の型変換とユースケースロジックが混在する
- Tauri 固有の制約（シリアライズ、エラーハンドリング）がビジネスロジックに漏洩するリスクがある
- 分離しておくことで、将来的に別のフロントエンド（CLI等）に対応する際の変更が最小限

## 影響

- `src-tauri/src/` 配下のディレクトリ構成は層ごとにモジュールを分割する（例: `commands/`, `application/`, `domain/`, `infrastructure/`）
- Tauri Command は `#[tauri::command]` アトリビュート付き関数を薄いラッパーとして実装する
- Domain Layer のトレイト定義が Application Layer と Infrastructure Layer の契約となる
- 新機能追加時は、まず Domain Layer のモデルとトレイトを設計し、その後 Infrastructure → Application → Command → UI の順に実装する
