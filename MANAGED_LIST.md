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

共通部品は、上段の左に検索欄、右に追加ボタン、その下に表を配置します。幅に収まらない検索欄は「ほかの絞り込み」にまとめます。利用側は業務データ、検索や並べ替えの意味、権限、遷移先、保存・削除処理を持ちます。検索条件や並べ替えの変更時は、利用側で先頭ページに戻します。

## 表の表示と操作

- 日付や状態などの短い値には `short` を指定します。書名や説明などは `long` を指定し、1行に収まらない部分は「…」で省略します。列幅は共通部品が設定します。
- 画面が狭くてもデータ列は表示し、収まらない部分は表の中で横にスクロールできます。行操作を設定した場合は右端の「操作」列にメニューを表示します。768px未満では「操作」列を隠し、対象の行を押すか、行にフォーカスして Enter または Space を押すとメニューが開きます。
- 行の操作や選択のない表示専用の表では、マウスを載せても行の色を変えません。ホバーの有無は表全体で決まります。
- 初回読み込みでは、同じ列構成の仮の行を表示して、実データに切り替わるときのレイアウトのずれを抑えます。実データの件数によって表の高さは変わります。表示後の再取得では、`refreshing` に表示済みの行を渡すと実データを表示したまま更新できます。

表の共通枠は `[data-chainwip-table]` で指定できます。枠の `aria-busy` は初回読み込みと一覧管理画面の再取得中に `true` になります。仮の行にだけ `[data-chainwip-skeleton-row]` が付きます。テストで行を操作するときは、対象の登録番号など、実データに固有のセルが表示されるまで待ちます。更新結果を確かめる場合は、セルの値が期待する値に変わるまで待ちます。

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

## 固定条件のある一覧を組み込む

親画面が館と対象月を決める貸出報告書では、親の値を一覧の取得条件に使います。ユーザーが変更する条件だけを `filters` に入れ、検索条件が変わったら先頭ページから取り直します。固定条件も検索欄に表示する必要がある場合は、その欄を `disabled: true` で指定します。`onSearch` には表示した固定欄の値も含まれるため、取得条件の固定値は常に親画面から取ります。親画面で固定値を確認できる場合は、その欄を `filters` から省けます。

```tsx
<HeadedCard title="貸出記録">
  <ManagedListPage
    rowKey={(loan) => loan.id}
    columns={loanColumns}
    data={loans}
    pagination={pagination}
    filters={[
      { key: "month", label: "対象月", kind: "month", value: report.month, disabled: true },
      { key: "title", label: "書名", kind: "text", value: search.title },
    ]}
    onSearch={({ title }) => updateLoanSearch({
      libraryId: report.libraryId,
      month: report.month,
      title: title ?? "",
      page: 1,
    })}
  />
</HeadedCard>
```

この例の `loans` は、親画面が決めた館・対象月と、利用者に許可された範囲の取得結果です。検索、ページ送り、並べ替えのどの取得でも、同じ固定条件と権限を適用します。

`ManagedListPage` は画面全体の枠を作らないため、検索や行操作が必要な一覧をパネルに置けます。固定条件だけで検索欄を表示しない場合は `filters` と `onSearch` を省けます。「追加」「再試行」に該当する操作もない場合、一覧のツールバーは表示されません。表示中心の子リストは `DataTable` を使います。報告書の Excel 出力など、親画面に対する操作は親画面で管理します。パネル構成型では、その操作の対象となるパネルの右上に置きます。
