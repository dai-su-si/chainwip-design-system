// 一覧の表の列の種類と幅の仕組み。列は「短い値」「長い値」「操作」の3種類にし、幅の決め方はこのファイルだけに置く。
// 列の幅は共通設定から取得する。
// 各画面は種類を指定するだけにし、画面ごとにpxを書かない
import { Grid, theme } from "antd";
import type { Breakpoint } from "antd";
import { useMemo } from "react";
import { useDesignValues } from "../theme/designValues";

/**
 * 操作の列を出す画面の幅。スマホの幅（768px未満、antdの md より狭い）では隠し、行を押す操作だけにする。
 */
export const ACTIONS_COLUMN_PRIORITY: { responsive: Breakpoint[] } = { responsive: ["md"] };
export const MANAGED_ROW_ACTIONS_KEY = "__chainwip_row_actions";

/**
 * 列の種類ごとの、antdの列に足す設定。
 * - short: 日付・時刻・時間帯・数値・状態・対象月・期間など。幅は文字の大きさ×values.list.shortColumnEm。省かない
 * - long: 名前・題名・内容など。幅を決めず、短い値と操作の列の残りを分け合う。
 *   1行に収まらない分は「…」で省き、全文はセルのtitle（マウスを載せると出る）で見る
 * 操作の列の幅は、共通設定の actionsColumnWidth に揃える。
 */
export function useColumnKinds() {
  const { token } = theme.useToken();
  const { shortColumnEm } = useDesignValues().list;
  return useMemo(
    () => ({
      short: { width: token.fontSize * shortColumnEm },
      long: { ellipsis: true },
    }),
    [token.fontSize, shortColumnEm],
  );
}

type SizedColumn = { width?: unknown; responsive?: Breakpoint[] };

/**
 * 表の横の幅の下限（antdの scroll.x に渡す）。短い値と操作の列は決めた幅、長い値の列は下限の幅（文字の大きさ×values.list.longColumnMinEm）で足し合わせる。
 * 今の画面の幅で隠れる列（responsive。今は768px未満の操作の列だけ）は数えない。表は見える幅とこの値の広い方になるため、
 * 広い画面では見える幅いっぱいに広がって長い値を「…」で省き、狭い画面ではすべての列を出したまま表の中で横にずらせる。
 */
export function useMinTableWidth(columns: readonly SizedColumn[] | undefined): number | undefined {
  const { token } = theme.useToken();
  const { longColumnMinEm } = useDesignValues().list;
  const screens = Grid.useBreakpoint();
  if (!columns?.length) return undefined;
  return columns
    .filter((c) => !c.responsive || c.responsive.some((bp) => screens[bp]))
    .reduce((sum, c) => sum + (typeof c.width === "number" ? c.width : token.fontSize * longColumnMinEm), 0);
}
