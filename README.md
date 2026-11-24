# chainwip-design-system

Ant Design を使った業務アプリ向けの React コンポーネントライブラリです。一覧の検索・行操作、詳細・編集フォーム、サイドバー、ダイアログなどを組み合わせて使えます。

## インストール

React 19、Ant Design 6、TypeScript を使うアプリ向けです。GitHub のタグからインストールし、利用側の Vite などで TypeScript、TSX、CSS を処理します。互換性のある依存バージョンは [package.json](package.json) の `peerDependencies` を参照してください。

```sh
npm install git+https://github.com/dai-su-si/chainwip-design-system.git#v0.18.0
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

`ThemeProvider` には既定の表示設定があり、`values` でテーマや一覧などの設定をセクション単位で置き換えられます。データの取得、ルーティング、認証、業務ルールは利用側のアプリで実装します。現時点では、一部コンポーネントの既定文言が日本語です。

## サンプルと開発

```sh
npm ci
npm run typecheck
npm run example
```

ブラウザーで http://localhost:5120/ を開くと、架空の図書貸出データを使ったサンプルを試せます。別のターミナルで `npx playwright install chromium` と `npm run example:screens` を実行すると、基本操作を検証してスクリーンショットを保存できます。

## ライセンス

[MIT](LICENSE)。一部は [antd-admin](https://github.com/zuiidea/antd-admin) に由来します。
