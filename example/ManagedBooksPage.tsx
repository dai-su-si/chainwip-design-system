import { Form } from "antd";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { BaseFormModal, ManagedListPage, TextField } from "chainwip-design-system";
import type { ManagedListColumn, ManagedListData, ManagedListFilter, ManagedListSort } from "chainwip-design-system";
import { BOOK_STATUSES, EMPTY_BOOK, genreLabel, INITIAL_BOOKS } from "./books";
import type { Book, BookInput } from "./books";

const PAGE_SIZE = 5;
const COLLATOR = new Intl.Collator("ja", { numeric: true });
const COLUMNS: readonly ManagedListColumn<Book>[] = [
  { key: "id", label: "書籍番号", kind: "short", value: (book) => book.id.toUpperCase().slice(0, 8), sortable: true },
  { key: "title", label: "書名", kind: "long", value: (book) => book.title, sortable: true },
  { key: "status", label: "状態", kind: "short", value: (book) => book.status },
  { key: "genres", label: "分野", kind: "short", value: (book) => book.genres.map(genreLabel).join("、") },
  { key: "note", label: "備考", kind: "long", value: (book) => book.note },
];

const WIDE_COLUMNS: readonly ManagedListColumn<Book>[] = [
  ...COLUMNS,
  { key: "collection", label: "所蔵館", kind: "long", value: () => "中央図書館 本館 一般閲覧室" },
];
const WIDE_BOOKS = INITIAL_BOOKS.map((book) => ({
  ...book,
  title: `${book.title} ― はじめて学ぶ人のための図鑑と実践ガイド 増補改訂版`,
  note: book.note || "取り置き期限と返却予定を、受付時に図書館の窓口で確認してください。",
}));
const SCENARIOS = ["ready", "empty", "loading", "refreshing", "error", "wide"] as const;
type Scenario = (typeof SCENARIOS)[number];

export function ManagedBooksPage({ scenarioParam, onRetry }: { scenarioParam: string | null; onRetry: () => void }) {
  const scenario = SCENARIOS.find((choice) => choice === scenarioParam) ?? "ready";
  const [filters, setFilters] = useState({ title: "", status: "", month: "2026-11" });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ManagedListSort | null>(null);
  const [catalog, setCatalog] = useState(INITIAL_BOOKS);
  const [editing, setEditing] = useState<Book | "new" | null>(null);
  const [form] = Form.useForm<Pick<BookInput, "title">>();
  const books = scenario === "wide" ? WIDE_BOOKS : catalog;
  const matches = books.filter((book) =>
    book.title.includes(filters.title) &&
    (!filters.status || book.status === filters.status) &&
    (!filters.month || filters.month === "2026-11"),
  );
  const sortColumn = COLUMNS.find((column) => column.sortable && column.key === sort?.key);
  if (sortColumn) {
    const direction = sort?.direction === "desc" ? -1 : 1;
    matches.sort((left, right) => direction * COLLATOR.compare(
      String(sortColumn.value(left) ?? ""),
      String(sortColumn.value(right) ?? ""),
    ));
  }

  const result = { rows: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: matches.length };
  const scenarios: Record<Scenario, ManagedListData<Book>> = {
    ready: { status: "ready", ...result },
    empty: { status: "ready", rows: [], total: 0 },
    loading: { status: "loading" },
    refreshing: { status: "refreshing", ...result },
    error: { status: "error", previous: result, onRetry },
    wide: { status: "ready", ...result },
  };
  const searchFields: ManagedListFilter[] = [
    {
      kind: "select",
      key: "status",
      label: "状態",
      value: filters.status,
      icon: BookOpen,
      options: BOOK_STATUSES.map((status) => ({ label: status, value: status })),
    },
    { kind: "month", key: "month", label: "対象月", value: filters.month },
  ];
  if (scenario === "wide") {
    searchFields.push({ kind: "text", key: "title", label: "書名", value: filters.title });
  }

  function openForm(book: Book | "new") {
    form.setFieldsValue({ title: book === "new" ? "" : book.title });
    setEditing(book);
  }

  function saveBook({ title }: Pick<BookInput, "title">) {
    if (editing === "new") {
      const book = { ...EMPTY_BOOK, id: crypto.randomUUID(), title };
      setCatalog((current) => [book, ...current]);
      setPage(1);
    } else if (editing) {
      setCatalog((current) => current.map((book) => book.id === editing.id ? { ...book, title } : book));
    }
    setEditing(null);
  }

  return (
    <>
      <ManagedListPage
        rowKey={(book) => book.id}
        columns={scenario === "wide" ? WIDE_COLUMNS : COLUMNS}
        filters={searchFields}
        onSearch={({ title = "", status, month }) => {
          setFilters({ title, status, month });
          setPage(1);
        }}
        onAdd={scenario === "wide" ? undefined : () => openForm("new")}
        rowActions={scenario === "wide" ? undefined : (book) => [
          { key: "edit", label: "編集", onSelect: () => openForm(book) },
        ]}
        data={scenarios[scenario]}
        pagination={{ page, pageSize: PAGE_SIZE, onChange: setPage }}
        sort={{
          value: sort,
          onChange: (next) => {
            setSort(next);
            setPage(1);
          },
        }}
      />
      <BaseFormModal
        title={editing === "new" ? "図書の追加" : "図書の編集"}
        open={editing !== null}
        okText="保存"
        cancelText="キャンセル"
        form={form}
        forceRender
        onCancel={() => setEditing(null)}
        onFinish={saveBook}
      >
        <TextField<Pick<BookInput, "title">> label="書名" name="title" required rules={[{ required: true, whitespace: true }]} />
      </BaseFormModal>
    </>
  );
}
