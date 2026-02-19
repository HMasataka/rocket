# Rocket

クロスプラットフォーム Git GUI クライアント。

## 技術スタック

- **バックエンド**: Rust + Tauri v2
- **フロントエンド**: React + TypeScript (Vite)
- **Git 操作**: git2-rs + git CLI ハイブリッド

## セットアップ

[Nix](https://nixos.org/) と [direnv](https://direnv.net/) が必要。

```bash
direnv allow   # 初回のみ。cargo, rustc, pnpm 等が自動で使えるようになる
pnpm install   # フロントエンドの依存をインストール
```

## 開発

```bash
# Tauri アプリを開発モードで起動（ホットリロード付き）
cargo tauri dev

# フロントエンドのみ起動（ブラウザで確認）
pnpm dev        # http://localhost:1420

# フロントエンドビルド
pnpm build

# プロダクションビルド（バイナリ生成）
cargo tauri build
```

## デザインモック

`designs/` にページ単位の HTML/CSS モックアップがある。

```bash
task designs:link    # ページ遷移スクリプトを注入して designs-linked/ へ出力
task designs:clean   # 注入済みスクリプトを除去
```

## ドキュメント

- [機能仕様](docs/features.md)
- [開発ロードマップ](docs/roadmap.md)
- [デザインカバレッジ](docs/design-coverage.md)
- [ADR（技術選定記録）](docs/adr/)
