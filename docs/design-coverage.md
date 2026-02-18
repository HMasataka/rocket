# デザインカバレッジ

docs/features.md の機能一覧と designs/ ディレクトリの対応状況。

## コア機能

### CLIインターフェース

- [ ] CLI起動・オプション（UIなし、デザイン不要の可能性あり）

### リポジトリ管理

- [x] リポジトリを開く (`open-repository/`)
- [x] クローン (`open-repository/` のCloneボタン)
- [x] 初期化 (`init/`)
- [x] 最近開いたリポジトリ (`open-repository/` のRecent Repositories)
- [ ] 複数リポジトリのタブ表示
- [x] .gitignoreテンプレート (`init/` の.gitignore Templateセレクト)

### 変更の確認・ステージング

- [x] ワーキングツリー状態表示・ステージング (`changes/`)
- [x] 差分ビューア・サイドバイサイド (`changes-split/`)
- [x] ハンク単位ステージング (`changes/` のStage Hunk/Discardボタン)
- [x] 行単位ステージング (`changes/` `changes-split/` のHunk Stagingアイコン)
- [ ] 変更の破棄（確認ダイアログ）

### コミット

- [x] コミットメッセージ入力（件名+本文） (`changes/` `changes-split/` のCommitフォーム)
- [x] Amend（直前コミット修正） (`changes/` `changes-split/` のAmendトグル)
- [x] 署名付きコミット（GPG/SSH） — `git config commit.gpgSign` で自動化、専用UIは不要

### ブランチ管理

- [x] ブランチ一覧 (`branches/`)
- [x] ブランチ操作ダイアログ (`branches-dialog/`)
- [ ] リベース
- [ ] インタラクティブリベース

### リモート操作

- [x] Fetch / Pull / Push / リモート管理 (`remote/`)

### 履歴・ログ表示

- [x] コミットグラフ・コミット詳細 (`history/`)
- [ ] フィルタリング（作者/日付/パス/メッセージ）
- [ ] Blame表示
- [ ] ファイル履歴

### スタッシュ

- [x] スタッシュ一覧・作成・適用・削除 (`stash/`)

### タグ

- [x] タグ一覧・作成・削除 (`tags/`)

### マージ・コンフリクト解決

- [x] コンフリクトファイル一覧 (`conflict/`)
- [x] 3ウェイマージビューア (`merge-viewer/`)

### サブモジュール

- [x] サブモジュール一覧・操作 (`submodules/`)

## 追加機能

### 検索

- [x] ファイル内容検索・コミット検索 (`search/`)

### ワークツリー

- [x] ワークツリー一覧・操作 (`worktrees/`)

### Cherry-pick

- [x] Cherry-pick実行 (`cherry-pick/`)

### Revert

- [x] コミット取り消し (`revert/`)

### Reset

- [x] Soft/Mixed/Hard Reset (`reset/`)

### Reflog

- [x] Reflog表示 (`reflog/`)

## AI連携

- [x] コミットメッセージ生成 (`ai-commit/`)
- [x] コードレビュー支援 (`ai-review/`)
- [x] AIアクション実行 (`ai-assist/`)
- [x] AI設定 (`settings-ai/`)
- [ ] 差分サマリー
- [ ] PR/MR説明文生成
- [ ] PRレビュー効率化ビュー
- [ ] コンフリクト解決支援（AI）
- [ ] コミット履歴の要約・Changelog生成

## UI/UX機能

### カスタマイズ

- [x] 外観設定（テーマ・カラー） (`settings-appearance/`)
- [x] キーバインド設定 (`settings-keybindings/`)
- [x] エディタ設定 (`settings-editor/`)
- [x] 外部ツール連携設定 (`settings-tools/`)
- [x] フォント設定
- [ ] レイアウトカスタマイズ

### GitHub/GitLab連携

- [ ] PR/MR作成
- [ ] Issue参照
- [ ] CI/CD状態表示

### その他

- [ ] Gitconfig編集
- [ ] GPG鍵管理
- [ ] SSH鍵管理
- [ ] 通知
- [x] 自動fetch
