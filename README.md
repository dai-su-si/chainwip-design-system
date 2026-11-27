# chainwip-design-system

TanStack Start と Cloudflare Workers を対象に、Ant Design で業務画面を一貫して組み立てるためのデザインシステムです。標準画面では共通部品を使い、用途固有の構成は特殊パネルに収めます。画面の選び方と共通ルールは [設計の大原則](DESIGN_PRINCIPLES.md) を参照してください。

## インストール

React 19、Ant Design 6、TypeScript を使うコンポーネントライブラリです。GitHub のタグを指定してインストールします。依存バージョンは [package.json](package.json) の `peerDependencies` を参照してください。

```sh
npm install git+https://github.com/dai-su-si/chainwip-design-system.git#v0.21.0
```

```tsx
import { ThemeProvider } from "chainwip-design-system";

export function App() {
  return (
    <ThemeProvider darkMode={false}>
      <main>業務画面</main>
    </ThemeProvider>
  );
}
```

ブランドの設定には `ThemeProvider` の `primaryColor` と `Sidebar` の `brandName`・`logoSrc` を使います。データの取得、ルーティング、認証、業務ルールは利用側のアプリで実装します。

## 列幅と余白の設定

`ThemeProvider` の `layoutTokens` では、アプリ全体で共通部品が使う列幅と余白を設定できます。たとえば、短い値の列幅とフォームの項目間隔だけを変える場合は次のように指定します。

```tsx
<ThemeProvider
  darkMode={false}
  layoutTokens={{
    columns: { shortColumnEm: 8 },
    spacing: { formItemGap: 16 },
  }}
>
  <App />
</ThemeProvider>
```

| 設定 | 用途 | 既定値 |
| --- | --- | --- |
| `columns.shortColumnEm` | 短い値の列の幅 | 9em |
| `columns.longColumnMinEm` | 表の最小幅を計算するときの、長い値の列の幅 | 7em |
| `columns.actionsColumnWidth` | 操作列の幅 | 60px |
| `spacing.pageGutter` | パネル構成型の段・列の間隔 | 16px |
| `spacing.betweenPanels` | パネル同士の間隔 | 16px |
| `spacing.headingToBody` | パネルの見出しと本文の間隔 | 24px |
| `spacing.betweenActions` | 各種操作パネルの操作同士の間隔 | 16px |
| `spacing.relatedContent` | 操作や入力部品と対応する補足の間隔 | 8px |
| `spacing.formLabelGap` | フォームのラベルと入力欄の間隔 | 8px |
| `spacing.formItemGap` | フォームの項目同士の間隔 | 20px |

指定値は単位なしの数値で、列幅は正の有限値、余白は0以上の有限値を使用できます。`Em` で終わる列幅は基準文字サイズの倍数です。ほかの値の単位は px です。省略または無効な値には、その項目の既定値が適用されます。

## パネル構成型

- `PanelPage` はパネルの本文列に使える幅を確保します。本文列の目安は640pxで、十分に広い場合は利用できる幅の約3分の2を使います。
- `PanelPage` に用途ごとのパネルを置きます。横並びにする場合は `PanelGroup` の直下に各パネルを置きます。既定は最大2列で、`columns={3}` では最大3列まで並びます。同じ行のパネルは同じ高さに揃い、幅が足りない場合は折り返します。
- パネル全体の目的や対象の説明は、`HeadedCard` の本文の冒頭に `p` や `ul` で置きます。本文の最初と最後の要素の外側の余白は共通の枠が除くため、見出しから説明までは共通の24px、説明の後ろはパネルの下の余白だけになります。
- `ActionPanel` には操作ごとの `label` と `onClick` を渡します。非同期の操作では実行中に該当項目の `loading` を設定します。取り消しの重い操作は `danger` を設定し、必要な確認は `useConfirmDanger` で行います。強調する主操作があるときだけ、その項目のキーを `primaryActionKey` に渡します。
- パネルのフォームを保存する `PanelSaveButton` は `HeadedCard.extra` に置きます。既定は `primary` です。すべてのパネルの保存を通常の強調度で表示するアプリでは、ルートの `ThemeProvider` に `panelSaveButtonType="default"` を指定します。

## 入力欄

- 固定の選択肢から複数のタグを選ぶ場合は `TagCloudField` を使います。利用者は表示名で検索し、フォームは選んだ選択肢の値の配列を受け取ります。選んだタグを詳細や表に表示する場合は `PillTagList`、利用者が任意の語を追加する場合は `WordListField` を使います。
- 選択肢や入力範囲で防げる誤りは、共通の入力欄を使って防ぎます。たとえば終了日に開始日より前の日を選べないようにする場合は、`RangeField` の終了側に `disabledDate` を渡します。
- `RangeField` と `RangeListField` は、開始・終了・付随する操作の順序を共有します。入力欄には共通の最小幅を確保し、収まらない欄や操作は次の行へ折り返します。
- 利用者が変えられない値は、変えられない表示にして防ぎます。`RangeField` の開始・終了の欄は `disabled`、3つ目の場所のチェックは `check.disabled` を指定します。
- 必須欄の未入力など、選択や入力の制約だけで防げない誤りは、利用側が `rules` に検証規則を渡し、対象欄に修正方法を表示します。たとえば「終了日は開始日以降にしてください」のように書きます。保存時の業務ルールの検証は利用側が担当します。

## サンプルと開発

標準の一覧画面は [一覧管理画面の公開 API](MANAGED_LIST.md) を参照してください。v0.18.0 から更新する場合は [移行ガイド](MIGRATION.md)、各版の変更内容は [リリースノート](CHANGELOG.md) を参照してください。

```sh
npm ci
npm run typecheck
npm run example
```

ブラウザーで [図書](http://localhost:5120/books) を開くと、架空の図書貸出データを使ったサンプルを試せます。[この例について](http://localhost:5120/about)、[入力の例](http://localhost:5120/fields)、[標準一覧](http://localhost:5120/managed-books) はそれぞれ URL から直接開けます。別のターミナルで `npx playwright install chromium` と `npm run example:screens` を実行すると、基本操作を検証してスクリーンショットを保存できます。

デモ起動中に `npm run example:audit` を実行すると、型、並べ替え、通常画面のボタン、追加と編集、関連する日付入力などを検査します。通常画面の画像は `.data/ui-audit/` に保存され、自動検査の不合格は終了コードに反映します。この検査の対象はローカルの部品デモです。

## ライセンス

[MIT](LICENSE)。一部は [antd-admin](https://github.com/zuiidea/antd-admin) に由来します。
