# 一覧管理画面の公開 API

対応構成は TanStack Start、Cloudflare Workers、Ant Design です。ルート側ではパッケージの入口から `ManagedListPage` を読み込みます。検索欄を渡すと一覧管理画面、検索欄を省くと検索なし一覧管理画面になります。どちらも同じ共通部品を使います。

## 利用側が指定するもの

| 入力 | 契約 |
| --- | --- |
| `rowKey` | 行を一意に識別する安定した文字列を返します。 |
| `columns` | 列のキー、見出し、種類（`short` または `long`）、文字列や数値を返す `value` を指定します。状態タグなどのセル表示には `render` を指定できます。並べ替えに対応する列には `sortable` を指定します。 |
| `filters` と `onSearch` | テキスト、選択肢、年月から検索欄を定義します。選択肢と年月は選択時に適用します。テキストは入力欄の検索操作で適用します。各欄は個別にクリアでき、変更後の条件一式を `onSearch` で受け取れます。年月の値は `YYYY-MM`、未指定は空文字です。 |
| `onAdd` | 追加可能なときだけ渡します。共通の「追加」ボタンが右上に表示されます。 |
| `rowActions` | 行ごとに操作名と実行処理を返します。必要に応じて操作アイコンを指定できます。権限や状態に応じて、利用側が操作を選びます。 |
| `data` | 初回読込（`loading`）、表示（`ready`）、表示を保った再取得（`refreshing`）、取得失敗（`error`）を渡します。再取得には表示済みの行を渡します。失敗時は、直前の行と再試行の処理を指定できます。 |
| `emptyText` | 一覧が空のときに表示する業務上必要なメッセージを、任意で指定します。 |
| `pagination` と `sort` | 現在のページ番号（1始まり）、ページサイズ、必要に応じて並べ替えを指定します。ページサイズを利用者が選べる場合は `showSizeChanger` を指定し、変更後のページ番号とサイズを `onChange` で受け取ります。未指定の並び順は `null` です。並べ替え対応列では昇順・降順を切り替えます。 |

共通部品は、上段の左に検索欄、右に追加ボタン、その下に表を配置します。幅に収まらない検索欄は「ほかの絞り込み」にまとめます。狭い画面では表の中を横にスクロールし、行から操作メニューを開きます。利用側は業務データ、検索や並べ替えの意味、権限、遷移先、保存・削除処理を持ちます。検索条件や並べ替えの変更時は、利用側で先頭ページに戻します。

## 使用例

```tsx
import { ManagedListPage } from "chainwip-design-system";

type Book = { id: string; title: string; status: string };

export function BooksPage({ books, addBook, editBook }: {
  books: Book[];
  addBook: () => void;
  editBook: (id: string) => void;
}) {
  return (
    <ManagedListPage
      rowKey={(book) => book.id}
      columns={[
        { key: "title", label: "書名", kind: "long", value: (book) => book.title },
        { key: "status", label: "状態", kind: "short", value: (book) => book.status },
      ]}
      data={{ status: "ready", rows: books, total: books.length }}
      pagination={{ page: 1, pageSize: Math.max(1, books.length), onChange: () => {} }}
      onAdd={addBook}
      rowActions={(book) => [
        { key: "edit", label: "編集", onSelect: () => editBook(book.id) },
      ]}
    />
  );
}
```

検索付きの実装は、図書貸出サンプルの[標準一覧](http://localhost:5120/managed-books)で確認できます。

データ状態ごとの確認には、[空](http://localhost:5120/managed-books?state=empty)、[初回読み込み](http://localhost:5120/managed-books?state=loading)、[再取得中](http://localhost:5120/managed-books?state=refreshing)、[取得失敗](http://localhost:5120/managed-books?state=error)、[長文・多列](http://localhost:5120/managed-books?state=wide)の URL を使います。
