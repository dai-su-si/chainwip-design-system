import { App, Form } from "antd";
import { CircleDot, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  BaseFormModal,
  ManagedListPage,
  notifyLifecycle,
  PillTag,
  PillTagList,
  SelectField,
  TagCloudField,
  TextAreaField,
  TextField,
  useConfirmDanger,
  useFormDialog,
} from "chainwip-design-system";
import type { ManagedListColumn, ManagedListSort, MutationLifecycle } from "chainwip-design-system";
import { BOOK_STATUSES, EMPTY_BOOK, GENRE_GROUPS, INITIAL_BOOKS, genreLabel } from "./books";
import type { Book, BookInput, BookStatus, Genre } from "./books";

const OPTIONS = BOOK_STATUSES.map((status) => ({ label: status, value: status }));
const WAIT_MS = 300;
const COLUMNS: readonly ManagedListColumn<Book>[] = [
  { key: "title", label: "書名", kind: "long", value: (book) => book.title, sortable: true },
  {
    key: "status",
    label: "状態",
    kind: "short",
    value: (book) => book.status,
    render: (book) => <PillTag color={book.status === "貸出中" ? "processing" : undefined}>{book.status}</PillTag>,
    sortable: true,
  },
  {
    key: "genres",
    label: "分野",
    kind: "long",
    value: (book) => book.genres.map(genreLabel).join("、") || null,
    render: (book) => book.genres.length > 0
      ? <PillTagList items={book.genres.map((genre) => ({ key: genre, label: genreLabel(genre) }))} />
      : null,
  },
  { key: "note", label: "メモ", kind: "long", value: (book) => book.note || null },
];

export function BooksPage() {
  const { message } = App.useApp();
  const confirmDanger = useConfirmDanger();
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [filters, setFilters] = useState({ title: "", status: "" });
  const [{ page, pageSize }, setPagination] = useState({ page: 1, pageSize: 100 });
  const [sort, setSort] = useState<ManagedListSort | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<BookInput>();
  const dialog = useFormDialog<Book, BookInput>(form);

  const filtered = books.filter((book) => book.title.includes(filters.title) && (!filters.status || book.status === filters.status));
  const sortColumn = COLUMNS.find((column) => column.sortable && column.key === sort?.key);
  if (sortColumn && sort) {
    const direction = sort.direction === "asc" ? 1 : -1;
    filtered.sort((left, right) => direction * String(sortColumn.value(left)).localeCompare(String(sortColumn.value(right)), "ja"));
  }
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));

  function run<Values>(lifecycle: MutationLifecycle<Values>, values: Values, apply: () => void) {
    setSaving(true);
    lifecycle.onMutate?.(values);
    window.setTimeout(() => {
      apply();
      setSaving(false);
      lifecycle.onSuccess?.(values);
    }, WAIT_MS);
  }

  function save(input: BookInput) {
    if (dialog.editing) {
      const id = dialog.editing.id;
      run(notifyLifecycle<BookInput>(message, "book-update", "update", dialog.close), input, () =>
        setBooks((current) => current.map((book) => (book.id === id ? { ...book, ...input } : book))),
      );
    } else {
      const id = crypto.randomUUID();
      run(notifyLifecycle<BookInput>(message, "book-create", "create", dialog.close), input, () =>
        setBooks((current) => [{ id, ...input }, ...current]),
      );
    }
  }

  function remove(book: Book) {
    confirmDanger({
      title: "この図書を削除しますか",
      content: `「${book.title}」を削除します。元に戻せません。`,
      okText: "削除",
    }, () => run(notifyLifecycle<string>(message, "book-delete", "delete"), book.id, () =>
      setBooks((current) => current.filter((item) => item.id !== book.id)),
    ));
  }

  return (
    <>
      <ManagedListPage
        rowKey={(book) => book.id}
        columns={COLUMNS}
        filters={[
          { kind: "text", key: "title", label: "書名を検索", value: filters.title },
          { kind: "select", key: "status", label: "状態", value: filters.status, icon: CircleDot, options: OPTIONS },
        ]}
        onSearch={({ title, status }) => {
          setFilters({ title, status });
          setPagination({ page: 1, pageSize });
        }}
        sort={{ value: sort, onChange: setSort }}
        data={{ status: "ready", rows: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), total: filtered.length }}
        emptyText="図書はまだありません。右上の「追加」から足せます。"
        pagination={{ page: currentPage, pageSize, onChange: (page, pageSize) => setPagination({ page, pageSize }), showSizeChanger: true }}
        onAdd={() => dialog.openCreate(EMPTY_BOOK)}
        rowActions={(book) => [
          { key: "edit", label: "編集", icon: <Pencil size="1em" />, onSelect: () => dialog.openEdit(book, book) },
          { key: "delete", label: "削除", icon: <Trash2 size="1em" />, danger: true, onSelect: () => remove(book) },
        ]}
      />
      <BaseFormModal<BookInput>
        open={dialog.open}
        title={dialog.editing ? "図書の編集" : "図書の追加"}
        okText="保存"
        cancelText="キャンセル"
        form={form}
        confirmLoading={saving}
        forceRender
        onCancel={dialog.close}
        onFinish={save}
      >
        <TextField<BookInput> name="title" label="書名" rules={[{ required: true, message: "書名を入れてください" }]} />
        <SelectField<BookInput, BookStatus> name="status" label="状態" options={OPTIONS} />
        <TagCloudField<BookInput, Genre> name="genres" label="分野" options={GENRE_GROUPS} placeholder="分野を検索して選ぶ" ariaLabel="分野" />
        <TextAreaField<BookInput> name="note" label="メモ" rows={{ minRows: 3, maxRows: 3 }} />
      </BaseFormModal>
    </>
  );
}
