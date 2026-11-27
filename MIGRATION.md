# v0.18.0 からの移行ガイド

v0.19 系では、標準の一覧とパネルを共通部品で組みます。アプリが管理するデータ、ルート、権限、保存処理は、新しい部品に必要な値やコールバックとして渡します。

## 一覧

| v0.18.0 で使っていたもの | v0.19 系での組み方 |
| --- | --- |
| `FilterToolbar`、`keywordSlot`、`selectSlot`、`monthSlot`、`yearSlot` | 検索条件を `ManagedListPage.filters` に定義し、変更を `onSearch` で受け取ります。キーワードは `text`、選択は `select`、対象月は `month` を使います。年だけの選択には、年の選択肢を用意して `select` を使えます。 |
| `useListPage`、`ListSearchSchema`、`ListSearch`、`DEFAULT_LIST_SEARCH`、`withDefaultSort`、`listParams` | URL の検索条件の型、初期値、検証、API リクエストへの変換をルートやアプリ側の共通処理に移します。共通部品には取得結果と現在の `pagination`、`sort` を渡します。 |
| `RowActions`、`rowActionsColumn`、`findRowMenu`、`MenuRow`、`useRowActions` | 各行で実行できる操作を `rowActions(row)` から返します。操作は `key`、`label`、`onSelect` で定義します。削除などに確認が必要な場合は、`onSelect` から共通確認ダイアログを呼び出します。 |
| `LinkList` | 行を開く子リストは `DataTable` と `rowOpenColumn` を組み合わせます。 |

たとえば検索条件と並べ替えを URL に保存する画面では、ルートが URL を検証し、画面は次のように一覧へ渡します。検索や並べ替えが変わったら、先頭ページを指定して取り直します。データの取得処理には、条件に合う総件数と現在ページの行を返させます。

```tsx
<ManagedListPage
  rowKey={(book) => book.id}
  columns={columns}
  data={data}
  filters={[{ key: "title", label: "書名", kind: "text", value: search.title }]}
  onSearch={({ title }) => updateSearch({ title: title ?? "", page: 1 })}
  pagination={{
    page: search.page,
    pageSize: search.pageSize,
    onChange: (page, pageSize) => updateSearch({ page, pageSize }),
  }}
  sort={{ value: search.sort, onChange: (sort) => updateSearch({ sort, page: 1 }) }}
  rowActions={(book) => [
    { key: "edit", label: "編集", onSelect: () => openBook(book.id) },
  ]}
/>
```

現行の型と用途は [一覧管理画面の公開 API](MANAGED_LIST.md) を参照してください。

## パネルと説明文

- `EditPage` は `PanelPage` に置き換えます。`FormCard` は、内容を示す `title` を付けた `HeadedCard` に置き換えます。パネル全体の保存は、パネルごとのフォームで `HeadedCard.extra` に渡します。
- `HeadedCard.description` がパネル全体の目的や対象を伝える場合は、本文の冒頭に移します。特定の入力欄の説明ならその欄の `extra`、操作ボタンの説明なら `ActionPanel` の対象項目の `description` に移します。
- `PanelNotice` と `notice` の指定を外します。入力に必要な注意は対象欄の補足に置き、入力エラーは対象欄に表示します。
- 見出しとパンくずは文字で示します。`HeadedCard.icon` と `Crumb.icon` の指定を取り除き、パネルの `style` による調整は整理します。
- `ActionPanel` の項目は `action` 要素から `label` と `onClick` に移します。

```tsx
<Form layout="vertical" onFinish={saveLoanSettings}>
  <HeadedCard title="貸し出し条件" extra={<PanelSaveButton />}>
    <p>この館で扱う図書の貸出条件を設定します。</p>
    <TextField
      name="loanNote"
      label="貸出時の案内"
      extra="貸出票に表示する短い案内を入力してください。"
    />
  </HeadedCard>
</Form>
```

## サイドメニューの権限

v0.21.1 から、`Sidebar.grantedPermissions` で項目の `permissions` による出し分けを共通の枠が行います。利用側で権限に応じて `hidden` を書き換えていた場合は、その処理を取り除きます。各項目に必要な権限を `permissions` に、利用者が持つ権限を `grantedPermissions` に渡します。使い方は [サイドメニュー](README.md#サイドメニュー) を参照してください。

## テーマ

`ThemeProvider.values` と旧トークン API の参照を取り除きます。ブランド色は `ThemeProvider.primaryColor`、ロゴとアプリ名は `Sidebar.logoSrc` と `Sidebar.brandName` に渡します。対応版でアプリ共通の列幅や余白を変える場合は、[列幅と余白の設定](README.md#列幅と余白の設定) を参照してください。
