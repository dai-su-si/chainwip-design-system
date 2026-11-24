import { Skeleton, Table, theme } from "antd";
import type { TableProps } from "antd";
import type { ColumnGroupType, ColumnsType, ColumnType } from "antd/es/table";
import type { GlobalToken } from "antd/es/theme/interface";
import type { CSSProperties } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

/** 文字1行の高さ（表のセルの行の高さ） */
function lineHeightPx(token: GlobalToken): number {
  return token.fontSize * token.lineHeight;
}

/** セルの上下の余白（antdの Table の cellPaddingBlock・MD・SM と同じ token） */
function cellPaddingBlock(size: TableProps["size"], token: GlobalToken): number {
  if (size === "large") return token.padding;
  if (size === "middle") return token.paddingSM;
  return token.paddingXS;
}

/**
 * 本物の行の高さ。操作の列があれば「︙」のButton（controlHeight）、なければ文字1行で決まる
 */
function rowHeight(size: TableProps["size"], token: GlobalToken, hasActions: boolean): number {
  const content = hasActions ? Math.max(token.controlHeight, lineHeightPx(token)) : lineHeightPx(token);
  return content + cellPaddingBlock(size, token) * 2 + token.lineWidth;
}

function numericScrollY(scroll: TableProps<object>["scroll"]): number | undefined {
  const y = scroll?.y;
  return typeof y === "number" && Number.isFinite(y) && y > 0 ? y : undefined;
}

function clampRows(bodyHeight: number, rowH: number): number {
  return Math.max(3, Math.floor(bodyHeight / rowH));
}

function initialRowCount(scroll: TableProps<object>["scroll"], rowH: number): number {
  const y = numericScrollY(scroll);
  return y != null ? clampRows(y, rowH) : 10;
}

export type DataTableSkeletonProps<RecordType extends object> = Pick<
  TableProps<RecordType>,
  "columns" | "rowSelection" | "pagination" | "size" | "scroll" | "rootClassName" | "style" | "locale"
> & {
  /**
   * Fixed skeleton row count. When omitted, rows are derived from `scroll.y` (if numeric)
   * or from the table frame height so the body roughly fills the visible area.
   */
  rowCount?: number;
};

function isActionColumn<RecordType extends object>(col: ColumnType<RecordType>): boolean {
  return (
    col.key === "actions" ||
    col.dataIndex === "actions" ||
    (typeof col.title === "string" && col.title.toLowerCase() === "actions")
  );
}

function isIdColumn<RecordType extends object>(col: ColumnType<RecordType>): boolean {
  return col.key === "id" || col.dataIndex === "id";
}

function isColumnGroup<RecordType extends object>(
  col: ColumnType<RecordType> | ColumnGroupType<RecordType>,
): col is ColumnGroupType<RecordType> {
  return "children" in col && Array.isArray(col.children) && col.children.length > 0;
}

/** 長い値の列（幅を決めず「…」で省く列。useColumnKinds の long） */
function isLongColumn<RecordType extends object>(col: ColumnType<RecordType>): boolean {
  return Boolean(col.ellipsis) || typeof col.width !== "number";
}

function hasActionColumn<RecordType extends object>(columns: ColumnsType<RecordType> | undefined): boolean {
  return (columns ?? []).some((c) =>
    isColumnGroup(c) ? hasActionColumn(c.children) : isActionColumn(c as ColumnType<RecordType>),
  );
}

const DATA_CELL_MIN = 48;

function dataCellMinWidth<RecordType extends object>(col: ColumnType<RecordType>): number {
  const cap = typeof col.minWidth === "number" ? col.minWidth : col.width;
  if (typeof cap !== "number") return DATA_CELL_MIN;
  return Math.max(DATA_CELL_MIN, Math.min(cap, 320));
}

function cellJustify(align: ColumnType<object>["align"]): CSSProperties["justifyContent"] {
  if (align === "right") return "flex-end";
  if (align === "center") return "center";
  return "flex-start";
}

function skeletonInputBarStyle(
  token: GlobalToken,
  opts: { floor: number; maxWidth: number | string; flex: string },
): CSSProperties {
  return {
    width: "100%",
    minWidth: opts.floor,
    maxWidth: opts.maxWidth,
    height: token.fontSize,
    borderRadius: token.borderRadiusSM,
    flex: opts.flex,
  };
}

function mapSkeletonColumn<RecordType extends object>(
  col: ColumnType<RecordType> | ColumnGroupType<RecordType>,
  token: GlobalToken,
): ColumnType<RecordType> | ColumnGroupType<RecordType> {
  if (isColumnGroup(col)) {
    return {
      ...col,
      children: (col.children as ColumnsType<RecordType>).map((child) =>
        mapSkeletonColumn(child, token),
      ),
    };
  }

  const c = col as ColumnType<RecordType>;
  // 並べ替えの印は、読み終えた後と同じに出す（押しても何も起きない。比べる関数は灰色の行に使わない）
  const sortable = Boolean(c.sorter);
  // セルの中身の高さを、本物の行と同じにする（文字1行。操作の列は「︙」のButtonの高さ）
  const lineH = lineHeightPx(token);
  return {
    ...c,
    sorter: sortable,
    sortOrder: sortable ? (c.sortOrder ?? null) : undefined,
    ...(sortable ? { onHeaderCell: () => ({ style: { pointerEvents: "none" as const } }) } : {}),
    render: () => {
      if (isActionColumn(c)) {
        const w = token.controlHeightSM;
        return (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: token.controlHeight,
              justifyContent: cellJustify(c.align),
              lineHeight: 1,
            }}
          >
            <Skeleton.Button
              active
              size="small"
              shape="circle"
              style={{ width: w, height: w, minWidth: w, flexShrink: 0 }}
            />
          </span>
        );
      }

      const justify = cellJustify(c.align);
      const id = isIdColumn(c);

      if (id) {
        const floor = 28;
        const maxBar = typeof c.width === "number" ? Math.max(28, Math.min(c.width - 10, 52)) : 40;
        return (
          <div style={{ display: "flex", alignItems: "center", height: lineH, overflow: "hidden" }}>
            <Skeleton.Input
              active
              size="small"
              style={skeletonInputBarStyle(token, {
                floor,
                maxWidth: maxBar,
                flex: "0 1 auto",
              })}
            />
          </div>
        );
      }

      // 長い値の列は、灰色の棒を列の幅いっぱいにする
      if (isLongColumn(c)) {
        return (
          <div style={{ display: "flex", alignItems: "center", width: "100%", height: lineH, overflow: "hidden" }}>
            <Skeleton.Input active size="small" block style={{ height: token.fontSize, borderRadius: token.borderRadiusSM }} />
          </div>
        );
      }

      const floor = dataCellMinWidth(c);
      const bar = skeletonInputBarStyle(token, {
        floor,
        maxWidth: "100%",
        flex: "1 1 auto",
      });

      return (
        <div
          style={{
            width: "100%",
            minWidth: floor,
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            height: lineH,
            justifyContent: justify,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <Skeleton.Input active size="small" style={bar} />
        </div>
      );
    },
  };
}

export function DataTableSkeleton<RecordType extends object = object>({
  columns,
  rowSelection,
  pagination,
  size = "small",
  scroll,
  rootClassName,
  style,
  locale,
  rowCount,
}: DataTableSkeletonProps<RecordType>) {
  const { token } = theme.useToken();
  const frameRef = useRef<HTMLDivElement>(null);
  const rowH = rowHeight(size, token, hasActionColumn(columns as ColumnsType<RecordType> | undefined));
  const [measuredRows, setMeasuredRows] = useState(() => initialRowCount(scroll, rowH));

  useLayoutEffect(() => {
    if (rowCount != null) return;

    const y = numericScrollY(scroll);
    if (y != null) {
      setMeasuredRows(clampRows(y, rowH));
      return;
    }

    const el = frameRef.current;
    if (!el) return;

    const measure = () => {
      const thead = el.querySelector<HTMLElement>(".ant-table-thead");
      const pag = pagination === false ? null : el.querySelector<HTMLElement>(".ant-pagination");
      const theadH = thead?.offsetHeight ?? 39;
      const pagH = pag ? pag.offsetHeight + 8 : 0;
      const bodyH = Math.max(0, el.clientHeight - theadH - pagH - 2);
      setMeasuredRows((prev) => {
        const next = clampRows(bodyH, rowH);
        return prev === next ? prev : next;
      });
    };

    const ro = new ResizeObserver(() => requestAnimationFrame(measure));
    ro.observe(el);
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(measure);
    });

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [rowCount, pagination, scroll?.y, rowH]);

  const effectiveRowCount = rowCount ?? measuredRows;

  const skeletonColumns = useMemo(() => {
    if (!columns?.length) return [];
    return (columns as ColumnsType<RecordType>).map((col) => mapSkeletonColumn(col, token));
  }, [columns, token]);

  const skeletonData = useMemo(
    () =>
      Array.from({ length: effectiveRowCount }, (_, i) => ({
        __sk: String(i),
      })) as unknown as RecordType[],
    [effectiveRowCount],
  );

  const skeletonPagination = useMemo((): TableProps<RecordType>["pagination"] => {
    if (pagination === false) return false;
    if (typeof pagination === "object" && pagination !== null) {
      return {
        ...pagination,
        disabled: true,
        onChange: undefined,
        onShowSizeChange: undefined,
      };
    }
    return {
      current: 1,
      pageSize: 10,
      total: 100,
      disabled: true,
      showSizeChanger: true,
      showTotal: () => (
        <Skeleton.Input active size="small" style={{ width: 88, height: token.fontSize }} />
      ),
    };
  }, [pagination, token.fontSize]);

  const selection =
    rowSelection != null
      ? { ...rowSelection, getCheckboxProps: () => ({ disabled: true }) }
      : undefined;

  return (
    <div
      ref={frameRef}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      <Table<RecordType>
        rootClassName={rootClassName}
        style={{ flex: 1, minHeight: 0, width: "100%" }}
        size={size}
        columns={skeletonColumns}
        dataSource={skeletonData}
        rowKey={(record) => String((record as unknown as { __sk: string }).__sk)}
        onRow={() => ({ "data-chainwip-skeleton-row": "", "aria-hidden": true })}
        pagination={skeletonPagination}
        rowSelection={selection}
        scroll={scroll}
        locale={locale}
        showSorterTooltip={false}
      />
    </div>
  );
}
