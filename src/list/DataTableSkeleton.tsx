import { Grid, Skeleton, Table, theme } from "antd";
import type { TableProps } from "antd";
import type { ColumnGroupType, ColumnsType, ColumnType } from "antd/es/table";
import type { GlobalToken } from "antd/es/theme/interface";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { MANAGED_ROW_ACTIONS_KEY } from "./columnKinds";

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
    col.key === MANAGED_ROW_ACTIONS_KEY ||
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

function hasVisibleActionColumn<RecordType extends object>(
  columns: ColumnsType<RecordType> | undefined,
  screens: ReturnType<typeof Grid.useBreakpoint>,
): boolean {
  return (columns ?? []).some((column) => {
    if (column.hidden) return false;
    if (column.responsive && !column.responsive.some((breakpoint) => screens[breakpoint])) return false;
    return isColumnGroup(column) ? hasVisibleActionColumn(column.children, screens) : isActionColumn(column);
  });
}

function cellJustify(align: ColumnType<object>["align"]): CSSProperties["justifyContent"] {
  if (align === "right") return "flex-end";
  if (align === "center") return "center";
  return "flex-start";
}

function mapSkeletonColumn<RecordType extends object>(
  col: ColumnType<RecordType> | ColumnGroupType<RecordType>,
  token: GlobalToken,
): ColumnType<RecordType> | ColumnGroupType<RecordType> {
  if (isColumnGroup(col)) {
    return {
      ...col,
      children: col.children.map((child) => mapSkeletonColumn(child, token)),
    };
  }

  const c = col;
  // 並べ替えの印は、読み終えた後と同じに出す（押しても何も起きない。比べる関数は灰色の行に使わない）
  const sortable = Boolean(c.sorter);
  // セルの中身の高さを、本物の行と同じにする（文字1行。操作の列は「︙」のButtonの高さ）
  const lineH = lineHeightPx(token);
  return {
    ...c,
    sorter: sortable,
    sortOrder: sortable ? (c.sortOrder ?? null) : undefined,
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

      const id = isIdColumn(c);
      const idBarMax = typeof c.width === "number" ? Math.max(28, Math.min(c.width - 10, 52)) : 40;
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: lineH,
            justifyContent: cellJustify(c.align),
            overflow: "hidden",
          }}
        >
          <Skeleton.Input
            active
            size="small"
            block={!id}
            styles={{
              root: {
                minWidth: id ? "min(28px, 100%)" : 0,
                maxWidth: id ? `min(${idBarMax}px, 100%)` : "100%",
              },
              content: {
                width: "100%",
                minWidth: 0,
                height: token.fontSize,
                borderRadius: token.borderRadiusSM,
              },
            }}
          />
        </div>
      );
    },
  };
}

function SkeletonHeaderCell(props: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      {...props}
      tabIndex={undefined}
      onClick={undefined}
      onKeyDown={undefined}
      aria-description={undefined}
      style={{ ...props.style, pointerEvents: "none" }}
    />
  );
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
  const screens = Grid.useBreakpoint();
  const frameRef = useRef<HTMLDivElement>(null);
  const rowH = rowHeight(size, token, hasVisibleActionColumn(columns, screens));
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
      const body = el.querySelector<HTMLElement>(".ant-table-tbody");
      if (!body || !el.clientHeight) return;

      const headHeight = el.querySelector<HTMLElement>(".ant-table-thead")?.offsetHeight ?? 0;
      const scrollFrame = el.querySelector<HTMLElement>(".ant-table-content, .ant-table-body");
      const horizontalScrollbarHeight = scrollFrame ? scrollFrame.offsetHeight - scrollFrame.clientHeight : 0;
      const paginationHeight = Array.from(el.querySelectorAll<HTMLElement>(".ant-table-pagination")).reduce((height, page) => {
        const { marginBlockStart, marginBlockEnd } = getComputedStyle(page);
        return height + page.offsetHeight + (parseFloat(marginBlockStart) || 0) + (parseFloat(marginBlockEnd) || 0);
      }, 0);
      const bodyHeight = el.clientHeight - headHeight - paginationHeight - horizontalScrollbarHeight;
      // 自然な高さの表は、仮の行自身が枠を広げる。枠の高さに制約があるときだけ行数を調整する。
      if (Math.abs(bodyHeight - body.offsetHeight) <= 1) return;

      const renderedRowHeight = body.querySelector("[data-chainwip-skeleton-row]")?.getBoundingClientRect().height || rowH;
      setMeasuredRows(clampRows(Math.max(0, bodyHeight), renderedRowHeight));
    };

    let raf = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(el);
    scheduleMeasure();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [rowCount, pagination, scroll?.y, rowH]);

  const effectiveRowCount = rowCount ?? measuredRows;

  const skeletonColumns = useMemo(
    () => columns?.map((col) => mapSkeletonColumn(col, token)) ?? [],
    [columns, token],
  );

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
        components={{ header: { cell: SkeletonHeaderCell } }}
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
