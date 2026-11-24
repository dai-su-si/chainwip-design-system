import { Alert, Button, DatePicker, Dropdown, Grid, Input, Select, theme } from "antd";
import type { MenuProps, TableColumnsType, TableProps } from "antd";
import dayjs from "dayjs";
import { MoreVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cloneElement, isValidElement, useRef, useState } from "react";
import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";
import { AddButton } from "./AddButton";
import { ACTIONS_COLUMN_PRIORITY, useColumnKinds } from "./columnKinds";
import { DataTable } from "./DataTable";
import { FilterToolbar } from "./FilterToolbar";
import "./ManagedListPage.css";

export type ManagedListColumn<Row> = {
  key: string;
  label: string;
  kind: "short" | "long";
  value: (row: Row) => string | number | null | undefined;
  render?: (row: Row) => ReactNode;
  sortable?: boolean;
};

type FilterBase = {
  key: string;
  label: string;
  value: string;
  disabled?: boolean;
};

export type ManagedListFilter =
  | (FilterBase & { kind: "text" | "month" })
  | (FilterBase & { kind: "select"; options: readonly { label: string; value: string }[]; icon?: LucideIcon });

type Result<Row> = {
  rows: readonly Row[];
  total: number;
};

export type ManagedListData<Row> =
  | { status: "loading" }
  | (Result<Row> & { status: "ready" | "refreshing" })
  | { status: "error"; previous?: Result<Row>; onRetry?: () => void };

export type ManagedListSort = { key: string; direction: "asc" | "desc" };

export type ManagedListRowAction = {
  key: string;
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
};

type SearchProps =
  | { filters?: undefined; onSearch?: undefined }
  | { filters: readonly ManagedListFilter[]; onSearch: (values: Record<string, string>) => void };

export type ManagedListPageProps<Row> = SearchProps & {
  rowKey: (row: Row) => string;
  columns: readonly ManagedListColumn<Row>[];
  data: ManagedListData<Row>;
  pagination: { page: number; pageSize: number; onChange: (page: number, pageSize: number) => void; showSizeChanger?: boolean };
  emptyText?: string;
  sort?: { value: ManagedListSort | null; onChange: (value: ManagedListSort | null) => void };
  onAdd?: () => void;
  rowActions?: (row: Row) => readonly ManagedListRowAction[];
};

const NO_FILTERS: readonly ManagedListFilter[] = [];
const INTERACTIVE = "a, button, input, textarea, select, label, [role='button']";

type TextFilters = Record<string, { applied: string; draft: string }>;

function FilterControl({
  filter,
  value,
  onDraft,
  onApply,
}: {
  filter: ManagedListFilter;
  value: string;
  onDraft: (draft: string) => void;
  onApply: (value: string) => void;
}) {
  const { token } = theme.useToken();
  const width = useDesignValues().list.filterControlWidth;
  const style = { width };

  if (filter.kind === "select") {
    const Icon = filter.icon;
    return (
      <Select
        aria-label={filter.label}
        value={value || undefined}
        options={[...filter.options]}
        disabled={filter.disabled}
        placeholder={filter.label}
        allowClear={!filter.disabled}
        prefix={Icon && <Icon size={token.fontSize} aria-hidden />}
        style={style}
        onChange={(next: string | undefined) => onApply(next ?? "")}
      />
    );
  }
  if (filter.kind === "month") {
    const selectedMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? dayjs(`${value}-01`) : null;
    return (
      <DatePicker
        aria-label={filter.label}
        picker="month"
        format="YYYY年M月"
        placeholder={filter.label}
        value={selectedMonth?.format("YYYY-MM") === value ? selectedMonth : null}
        disabled={filter.disabled}
        allowClear={!filter.disabled}
        style={style}
        onChange={(date) => onApply(date?.format("YYYY-MM") ?? "")}
      />
    );
  }
  return (
    <Input.Search
      aria-label={filter.label}
      placeholder={filter.label}
      allowClear={!filter.disabled}
      value={value}
      disabled={filter.disabled}
      style={style}
      onChange={(event) => onDraft(event.target.value)}
      onSearch={(term) => onApply(term.trim())}
    />
  );
}

function ListToolbar({
  filters,
  onSearch,
  onAdd,
  onRetry,
}: {
  filters: readonly ManagedListFilter[];
  onSearch?: (values: Record<string, string>) => void;
  onAdd?: () => void;
  onRetry?: () => void;
}) {
  const [drafts, setDrafts] = useState<TextFilters>({});
  const retainedDrafts = Object.entries(drafts).filter(([key, draft]) =>
    filters.some((filter) => filter.kind === "text" && !filter.disabled && filter.key === key && filter.value === draft.applied),
  );
  if (retainedDrafts.length !== Object.keys(drafts).length) {
    setDrafts(Object.fromEntries(retainedDrafts));
  }

  if (filters.length === 0 && !onAdd && !onRetry) return null;

  return (
    <FilterToolbar
      slots={filters.map((filter) => {
        const draft = Object.hasOwn(drafts, filter.key) ? drafts[filter.key] : undefined;
        return {
          key: filter.key,
          children: (
            <FilterControl
              filter={filter}
              value={filter.kind === "text" && !filter.disabled && draft?.applied === filter.value ? draft.draft : filter.value}
              onDraft={(next) => setDrafts((current) => ({
                ...current,
                [filter.key]: { applied: filter.value, draft: next },
              }))}
              onApply={(value) => onSearch?.(
                Object.fromEntries(filters.map((item) => [item.key, item === filter ? value : item.value])),
              )}
            />
          ),
        };
      })}
      actions={<>
        {onRetry && <Button onClick={onRetry}>再試行</Button>}
        {onAdd && <AddButton onClick={onAdd} />}
      </>}
    />
  );
}

type ActionMenu = NonNullable<MenuProps["items"]>;

function rowMenuWithFocusReturn(menu: ReactNode, trigger: HTMLElement | null, close: () => void) {
  if (!isValidElement<{ onKeyDownCapture?: (event: KeyboardEvent) => void }>(menu)) return menu;
  return cloneElement(menu, {
    onKeyDownCapture(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close();
      requestAnimationFrame(() => trigger?.focus());
    },
  });
}

function RowActionButton({ items, rowLabel }: { items: ActionMenu; rowLabel: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const { token } = theme.useToken();
  if (!items.length) return null;

  return (
    <Dropdown
      autoFocus
      open={open}
      onOpenChange={setOpen}
      trigger={["click"]}
      placement="bottomRight"
      menu={{ items }}
      popupRender={(menu) => rowMenuWithFocusReturn(menu, trigger.current, () => setOpen(false))}
    >
      <Button
        ref={trigger}
        type="text"
        aria-label={`操作: ${rowLabel}`}
        aria-expanded={open}
        aria-haspopup="menu"
        icon={<MoreVertical size={token.fontSize} />}
      />
    </Dropdown>
  );
}

type ManagedRowProps = HTMLAttributes<HTMLTableRowElement> & {
  actionMenu?: ActionMenu;
  actionLabel?: string;
  narrow?: boolean;
};

function ManagedRow({ actionMenu, actionLabel, narrow, ...props }: ManagedRowProps) {
  const [open, setOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const trigger = useRef<HTMLTableRowElement>(null);
  const skipPointer = useRef(false);
  if (!actionMenu?.length) return <tr {...props} />;

  function capturePointer(event: MouseEvent<HTMLTableRowElement>) {
    const target = event.target;
    const row = event.currentTarget;
    const control = target instanceof Element ? target.closest(INTERACTIVE) : null;
    skipPointer.current = !(target instanceof Node) || !row.contains(target) || Boolean(control && row.contains(control));
    if (!skipPointer.current) setKeyboard(false);
  }

  return (
    <Dropdown
      autoFocus
      menu={{ items: actionMenu }}
      popupRender={(menu) => rowMenuWithFocusReturn(menu, trigger.current, () => setOpen(false))}
      trigger={keyboard ? ["click"] : ["click", "contextMenu"]}
      open={open}
      onOpenChange={(next) => {
        if (!next || !skipPointer.current) setOpen(next);
      }}
    >
      <tr
        {...props}
        ref={trigger}
        tabIndex={narrow ? 0 : -1}
        aria-label={narrow ? actionLabel : undefined}
        aria-haspopup={narrow ? "menu" : undefined}
        aria-expanded={narrow ? open : undefined}
        className={`${props.className ?? ""} chainwip-managed-list__action-row`}
        onClickCapture={capturePointer}
        onContextMenuCapture={capturePointer}
        onKeyDown={(event) => {
          if (!narrow || event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
          event.preventDefault();
          setKeyboard(true);
          setOpen(true);
        }}
      />
    </Dropdown>
  );
}

/** Standard list management layout with controlled filters, sorting, pagination, and data. */
export function ManagedListPage<Row extends object>({
  rowKey,
  columns,
  filters = NO_FILTERS,
  onSearch,
  onAdd,
  rowActions,
  data,
  pagination,
  emptyText,
  sort,
}: ManagedListPageProps<Row>) {
  const screens = Grid.useBreakpoint();
  const { actionsColumnWidth } = useDesignValues().list;
  const kinds = useColumnKinds();
  const loading = data.status === "loading";
  const result = data.status === "error" ? data.previous : data.status === "loading" ? undefined : data;
  const rowMenus = new Map(result?.rows.map((row) => {
    const key = rowKey(row);
    const first = columns[0]?.value(row);
    const items: ActionMenu = rowActions?.(row).map(({ key: id, label, icon, danger, disabled, onSelect }) => ({
      key: id, label, icon, danger, disabled, onClick: onSelect,
    })) ?? [];
    return [key, { items, rowLabel: first == null || first === "" ? key : String(first) }];
  }));

  const tableColumns: TableColumnsType<Row> = columns.map((column) => ({
    ...kinds[column.kind],
    key: column.key,
    title: column.label,
    ...(column.sortable && sort ? {
      sorter: true,
      sortDirections: ["ascend", "descend", "ascend"] as const,
      sortOrder: sort.value?.key === column.key ? (sort.value.direction === "asc" ? "ascend" : "descend") : null,
    } : {}),
    render: (_, row) => column.render?.(row) ?? column.value(row) ?? "—",
  }));

  if (rowActions) {
    tableColumns.push({
      key: "__chainwip_row_actions",
      title: "操作",
      ...ACTIONS_COLUMN_PRIORITY,
      width: actionsColumnWidth,
      render: (_, row) => {
        const menu = rowMenus.get(rowKey(row));
        return menu && <RowActionButton {...menu} />;
      },
    });
  }

  const onTableChange: TableProps<Row>["onChange"] = (_, __, next, details) => {
    if (!sort || details.action !== "sort") return;
    const selected = Array.isArray(next) ? next[0] : next;
    sort.onChange(selected.order && typeof selected.columnKey === "string"
      ? { key: selected.columnKey, direction: selected.order === "ascend" ? "asc" : "desc" }
      : null);
  };
  const refreshing = data.status === "refreshing";

  return (
    <section aria-label="一覧管理" className="chainwip-managed-list" data-screen-type="list">
      <ListToolbar filters={filters} onSearch={onSearch} onAdd={onAdd} onRetry={data.status === "error" ? data.onRetry : undefined} />
      {data.status === "error" && (
        <Alert
          type="error"
          showIcon
          title="一覧を読み込めませんでした"
        />
      )}
      <div role="status" className="chainwip-managed-list__status">
        {loading ? "一覧を読み込み中です" : refreshing ? "一覧を更新中です" : ""}
      </div>
      {(data.status !== "error" || result) && (
        <div aria-busy={loading || refreshing}>
          <DataTable<Row>
            rowKey={rowKey}
            columns={tableColumns}
            dataSource={result?.rows}
            loading={loading}
            locale={emptyText === undefined ? undefined : { emptyText }}
            pagination={result && (result.total > pagination.pageSize || pagination.page > 1) ? {
              total: result.total,
              current: pagination.page,
              pageSize: pagination.pageSize,
              showSizeChanger: pagination.showSizeChanger ?? false,
              showTotal: pagination.showSizeChanger ? (total) => `${total}件` : undefined,
              onChange: pagination.onChange,
            } : false}
            size="small"
            tableLayout="fixed"
            components={rowActions ? { body: { row: ManagedRow } } : undefined}
            onRow={rowMenus.size && rowActions ? (row) => {
              const menu = rowMenus.get(rowKey(row));
              const rowProps: ManagedRowProps = {
                actionMenu: menu?.items,
                actionLabel: menu && `操作: ${menu.rowLabel}`,
                narrow: screens.md === false,
              };
              return rowProps;
            } : undefined}
            onChange={onTableChange}
          />
        </div>
      )}
    </section>
  );
}
