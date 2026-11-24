# リリースノート

## v0.19.1

- 共通の表が読み込み状態を `aria-busy` で示し、初回読み込みの仮の行に識別用の属性を付けるようにしました。再取得中は表示済みの行を引き続き操作できます。[一覧管理画面の公開 API](MANAGED_LIST.md) に確認方法を追記しました。
- 一覧の列やホバーの仕様、タグ入力と入力検証の使い方を公開文書に追記しました。
- `ThemeProvider.layoutTokens` で、共通の列幅と余白のトークンをアプリ全体で個別に上書きできるようにしました。指定を省いた項目には既定値が適用されます。[列幅と余白の設定](README.md#列幅と余白の設定)
- [v0.18.0 からの移行ガイド](MIGRATION.md) と、[固定条件で一覧を組み込む例](MANAGED_LIST.md#固定条件のある一覧を組み込む) を追加しました。

## v0.19.0

- 検索、並べ替え、ページ送り、追加、行操作をまとめた標準画面 `ManagedListPage` を追加しました。[一覧管理画面の公開 API](MANAGED_LIST.md) に導入例があります。
- 図書貸出サンプルの各画面を直接 URL で開けるようにし、メニュー遷移とブラウザーの履歴を揃えました。

### v0.18.0 からの移行

- テーマの任意上書きとトークン操作の公開 API を廃止しました。`ThemeProvider.values` を取り除き、ブランド色は `ThemeProvider.primaryColor`、ロゴと名称は `Sidebar` で設定してください。

- 共通パネルは見出し・右上の操作・本文に整理しました。`HeadedCard.description` の情報は本文または対象の入力部品の補足に移し、`style` による個別の上書きは取り除いてください。`ActionPanel` の操作は `action` 要素から `label` と `onClick` に切り替えてください。
- 一覧画面の手組み用 API を廃止しました。`useListPage`、`FilterToolbar` の検索スロット（`keywordSlot`・`selectSlot`・`monthSlot`・`yearSlot`）、`useRowActions`、`rowActionsColumn` を使う画面は、`ManagedListPage` の検索・並べ替え・ページ送り・行操作の設定に移してください。URL の検索条件の型と検証は利用側で定義します。子リストを開く操作には `DataTable` と `rowOpenColumn` を使えます。

- 行を開く一覧を `DataTable` に統一しました。`LinkList` を使っていた箇所は `DataTable` と `rowOpenColumn` に切り替えてください。開く操作だけの列は見出しを省き、狭い画面でも開くボタンが表示されます。

- パンくずを文字だけに統一し、`Crumb.icon` を廃止しました。
- パネルの見出しを文字だけに統一しました。`HeadedCard` の `icon` を指定している場合は、その指定を削除してください。

- パネル構成型の画面枠を `PanelPage` に統合しました。`EditPage` を使っていた画面は `PanelPage` に、`FormCard` は内容を示す `title` 付きの `HeadedCard` に切り替えてください。保存操作はパネルごとのフォーム内で `HeadedCard.extra` に渡します。

- 入力パネルの先頭に表示する案内用の警告帯を廃止しました。更新時は `PanelNotice` の import と使用箇所、および `FormCard`・`HeadedCard` の `notice` 指定を削除してください。
