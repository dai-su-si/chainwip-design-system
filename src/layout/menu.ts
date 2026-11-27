// サイドメニューの項目の形と、パスの扱い。メニューの中身（どの項目を出すか）は使う側が渡す。
type BaseMenuNode = {
  id: string;
  name: string;
  /** アイコンの名前。Sidebar の iconFor で、lucideのアイコンに変える */
  icon: string | null;
  /** 出すのに要る権限。Sidebar の grantedPermissions にどれかがあれば出す。null は全員に出す */
  permissions: string[] | null;
  sort: number;
  hidden: boolean;
};

/** メニューの項目（item）と見出し（group）。形は雛形antd-adminのメニューのまま */
export type MenuItem =
  | (BaseMenuNode & {
      kind: "item";
      path: string;
      children: MenuItem[] | null;
    })
  | (BaseMenuNode & {
      kind: "group";
      path: null;
      children: MenuItem[];
    });

/** パンくずの1つの項目。to があればリンクにする（戻り先）。今いる画面は to を持たない */
export type Crumb = { label: string; to?: string };

/** Normalized pathname (no trailing slash except `/`) */
export function normalizeAppPath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

/**
 * 詳細の画面でも、もとの一覧のメニューを選んだ状態にするための対応。
 * 例: /books/abc → /books
 */
export function menuPathFor(pathname: string, menuPaths: string[]): string | undefined {
  const path = normalizeAppPath(pathname);
  return menuPaths
    .filter((p) => path === p || path.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];
}
