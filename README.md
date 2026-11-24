# chainwip-design-system

TanStack Start と Cloudflare Workers を対象に、Ant Design で業務画面を一貫して組み立てるためのデザインシステムです。標準画面では共通部品を使い、用途固有の構成は特殊パネルに収めます。画面の選び方と共通ルールは [設計の大原則](DESIGN_PRINCIPLES.md) を参照してください。

## インストール

React 19、Ant Design 6、TypeScript を使うコンポーネントライブラリです。GitHub のタグを指定してインストールします。依存バージョンは [package.json](package.json) の `peerDependencies` を参照してください。

```sh
npm install git+https://github.com/dai-su-si/chainwip-design-system.git#v0.19.0
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

## サンプルと開発

標準の一覧画面は [一覧管理画面の公開 API](MANAGED_LIST.md) を参照してください。旧版からの更新手順は [リリースノート](CHANGELOG.md) に記載しています。

```sh
npm ci
npm run typecheck
npm run example
```

ブラウザーで [図書](http://localhost:5120/books) を開くと、架空の図書貸出データを使ったサンプルを試せます。[この例について](http://localhost:5120/about)、[入力の例](http://localhost:5120/fields)、[標準一覧](http://localhost:5120/managed-books) はそれぞれ URL から直接開けます。別のターミナルで `npx playwright install chromium` と `npm run example:screens` を実行すると、基本操作を検証してスクリーンショットを保存できます。

デモ起動中に `npm run example:audit` を実行すると、型、並べ替え、通常画面のボタン、追加と編集、関連する日付入力などを検査します。通常画面の画像は `.data/ui-audit/` に保存され、自動検査の不合格は終了コードに反映します。この検査の対象はローカルの部品デモです。

## ライセンス

[MIT](LICENSE)。一部は [antd-admin](https://github.com/zuiidea/antd-admin) に由来します。
