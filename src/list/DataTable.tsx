import { ConfigProvider, Flex, Table, theme } from "antd";
import type { TableProps } from "antd";
import type { CSSProperties, ReactElement, ReactNode, Ref } from "react";
import { useEffect, useMemo } from "react";
import { withOpenColumnWidth } from "./rowOpenColumn";
import { defaultRowCountKey, readRowCount, writeRowCount } from "./rememberedRowCount";
import { useDesignValues } from "../theme/designValues";
import { useMinTableWidth } from "./columnKinds";
import { DataTableEmpty } from "./DataTableEmpty";
import { DataTableSkeleton } from "./DataTableSkeleton";
import "./DataTable.css";

/** Merged onto `Table` `rootClassName` with the flex layout class. */
const DATA_TABLE_ROOT_CLASS = "data-table__table";

/** antdの Table のページ送りの既定の1ページの行数 */
const DEFAULT_PAGE_SIZE = 10;

export type DataTableProps<RecordType extends object = object> = {
  /** Mark a background refresh as busy while keeping the supplied rows visible. */
  "aria-busy"?: boolean;
  /**
   * When the table uses `scroll.y`, set true so the frame does not shrink in the flex column
   * and optional `frameHeight` can pin the outer height.
   */
  lockScrollHeight?: boolean;
  /** Outer `max-height` (px) */
  maxHeight?: number;
  /** When `lockScrollHeight`, optional fixed outer `height` (usually same as max height) */
  frameHeight?: number;
  /** Flex column wrapping frame */
  layoutRef?: Ref<HTMLDivElement | null>;
  /** Bordered box around the table (e.g. for `scrollHeight` vs `clientHeight` checks) */
  frameRef?: Ref<HTMLDivElement | null>;
  /**
   * 前に読み終えたときの行数を覚えるキー。読み込み中は、その行数で灰色の行を出す。
   * 既定は画面のパスと列の名前・題（defaultRowCountKey）。
   */
  rowCountKey?: string;
} & TableProps<RecordType>;

export function DataTable<RecordType extends object = object>(
  props: DataTableProps<RecordType>,
): ReactElement {
  const {
    "aria-busy": ariaBusy,
    lockScrollHeight,
    maxHeight,
    frameHeight,
    layoutRef,
    frameRef,
    rowCountKey,
    rootClassName,
    style: tableStyle,
    ...tableProps
  } = props;

  const { token } = theme.useToken();
  const values = useDesignValues();

  const { loading, ...restTableProps } = tableProps;
  const spinLoading =
    loading === true ||
    (typeof loading === "object" &&
      loading !== null &&
      (loading as { spinning?: boolean }).spinning !== false);

  const outerStyle: CSSProperties = {
    flexGrow: 0,
    flexShrink: lockScrollHeight ? 0 : 1,
    flexBasis: "auto",
    minHeight: 0,
    maxHeight,
    ...(lockScrollHeight && frameHeight != null ? { height: frameHeight } : {}),
    alignSelf: "stretch",
    border: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const mergedRootClassName = [DATA_TABLE_ROOT_CLASS, rootClassName].filter(Boolean).join(" ");

  const mergedLocale = useMemo(
    () => ({
      ...restTableProps.locale,
      emptyText: restTableProps.locale?.emptyText ?? <DataTableEmpty />,
    }),
    [restTableProps.locale],
  );
  const emptyContent: ReactNode =
    typeof mergedLocale.emptyText === "function" ? mergedLocale.emptyText() : mergedLocale.emptyText;

  // 子リストの「開く」列は共通の幅を使う。
  const columns = useMemo(
    () => withOpenColumnWidth(restTableProps.columns, values.list.actionsColumnWidth),
    [restTableProps.columns, values.list.actionsColumnWidth],
  );
  // 横の幅の下限。スマホの幅で長い値の列が0pxに潰れたため
  const minTableWidth = useMinTableWidth(columns as { width?: unknown }[] | undefined);
  const scroll = minTableWidth ? { ...restTableProps.scroll, x: minTableWidth } : restTableProps.scroll;

  // 読み終えたら、今のページに出た行数を覚え、次の読み込み中はその行数で灰色の行を出す
  const countKey = rowCountKey ?? defaultRowCountKey(restTableProps.columns as { key?: unknown }[] | undefined);
  const { dataSource, pagination } = restTableProps;
  const shownRows =
    dataSource == null
      ? undefined
      : pagination === false
        ? dataSource.length
        : Math.min(dataSource.length, pagination?.pageSize ?? DEFAULT_PAGE_SIZE);
  useEffect(() => {
    if (!spinLoading && shownRows != null) writeRowCount(countKey, shownRows);
  }, [spinLoading, shownRows, countKey]);
  const rememberedRows = useMemo(
    () => (spinLoading ? readRowCount(countKey) : undefined),
    [spinLoading, countKey],
  );
  // 行の操作や選択がない表では、ホバー時も行の色を保つ。
  const clickable = Boolean(restTableProps.onRow || restTableProps.rowSelection);
  const table = (
    <Table<RecordType>
      {...restTableProps}
      columns={columns}
      scroll={scroll}
      locale={mergedLocale}
      loading={loading}
      rootClassName={mergedRootClassName}
      style={{ flex: 1, minHeight: 0, ...tableStyle }}
    />
  );

  return (
    <Flex
      ref={layoutRef}
      vertical
      gap={token.marginSM}
      style={{
        flex: "1 1 0%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div ref={frameRef} style={outerStyle} data-chainwip-table="" aria-busy={spinLoading || ariaBusy === true}>
        <div
          className="data-table__inner"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {spinLoading ? (
            <DataTableSkeleton<RecordType>
              columns={columns}
              rowSelection={restTableProps.rowSelection}
              pagination={restTableProps.pagination}
              size={restTableProps.size}
              scroll={scroll}
              rowCount={rememberedRows}
              // 0件と覚えていれば、空の案内と同じ高さの空きを出す（読み込み中に「ありません」とは出さない）
              locale={{ emptyText: <div style={{ visibility: "hidden" }}>{emptyContent}</div> }}
              rootClassName={mergedRootClassName}
              style={{ flex: 1, minHeight: 0, ...tableStyle }}
            />
          ) : clickable ? (
            table
          ) : (
            <ConfigProvider theme={{ components: { Table: { rowHoverBg: token.colorBgContainer } } }}>{table}</ConfigProvider>
          )}
        </div>
      </div>
    </Flex>
  );
}
