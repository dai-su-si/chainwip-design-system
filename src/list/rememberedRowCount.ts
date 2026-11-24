// 表ごとに、前に読み終えたときの行数を sessionStorage に覚える。読み込み中の灰色の行の数と表の高さを、
// 読み終えた後と同じにするため。
// sessionStorage が使えないときは、覚えていないものとして扱い、今までの動き（下端まで伸ばす）で出す。

const PREFIX = "chainwip-design-system:rows:";

function currentPathKey(): string {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

type KeyColumn = { key?: unknown; dataIndex?: unknown; title?: unknown };

/**
 * DataTable の表を見分けるキーの既定。画面のパスと、列の名前・題をつなぐ。
 * 1つの画面に表が複数あっても、列の題が違えば別の表として覚える。
 */
export function defaultRowCountKey(columns: readonly KeyColumn[] | undefined): string {
  const cols = (columns ?? [])
    .map((c) => `${String(c.key ?? c.dataIndex ?? "")}:${typeof c.title === "string" ? c.title : ""}`)
    .join(",");
  return `${currentPathKey()}|${cols}`;
}

export function readRowCount(key: string): number | undefined {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (raw == null) return undefined;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : undefined;
  } catch {
    return undefined;
  }
}

export function writeRowCount(key: string, count: number): void {
  try {
    window.sessionStorage.setItem(PREFIX + key, String(count));
  } catch {
    // 覚えられなくても、次の読み込み中が今までの動きになるだけのため、何もしない
  }
}
