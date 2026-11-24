// 図書の貸出の例。画面の枠（AppShell、メニュー2項目）、一覧管理画面（FilterToolbar＋DataTable）、
// ダイアログの編集の枠（BaseFormModal）、知らせ（notifyLifecycle）を、chainwip-design-system の部品だけで組む。
// ルーター・データの取り方・mock は使わず、useState の配列だけで動かす。
import { App, Button, Flex, Form, Input, Select, Typography, theme } from "antd";
import { BookOpen, CircleDot, Info, SquarePen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  ActionPanel,
  AddButton,
  AppShell,
  HeadedCard,
  BaseFormModal,
  ImageChoiceCards,
  DataTable,
  DEFAULT_LIST_SEARCH,
  FilterToolbar,
  PillTag,
  PillTagList,
  ProgressModal,
  atLeastMin,
  keywordSlot,
  LinkList,
  notifyLifecycle,
  rowActionsColumn,
  rowOpenColumn,
  selectSlot,
  TagCloud,
  useColumnKinds,
  useFormDialog,
  useGuideDialog,
  useListPage,
  useNotice,
  useRowActions,
} from "chainwip-design-system";
import type { Crumb, ImageChoice, ListSearch, MenuItem, MutationLifecycle, ProgressItem } from "chainwip-design-system";
import { FieldsPage } from "./FieldsPage";
import { BOOK_STATUSES, EMPTY_BOOK, GENRE_GROUPS, INITIAL_BOOKS, genreLabel } from "./books";
import type { Book, BookInput, Genre } from "./books";

const MENUS: MenuItem[] = [
  { id: "books", kind: "item", name: "図書", path: "/books", icon: "book", permissions: null, sort: 1, hidden: false, children: null },
  { id: "about", kind: "item", name: "この例について", path: "/about", icon: "info", permissions: null, sort: 2, hidden: false, children: null },
  { id: "fields", kind: "item", name: "入力の例", path: "/fields", icon: "fields", permissions: null, sort: 3, hidden: false, children: null },
];
const ICONS: Record<string, LucideIcon> = { book: BookOpen, info: Info, fields: SquarePen };
const iconFor = (icon: string) => ICONS[icon];

export function ExampleApp({ onToggleDarkMode }: { onToggleDarkMode: () => void }) {
  const [path, setPath] = useState("/books");
  const [collapsed, setCollapsed] = useState(false);
  const crumbs: Crumb[] =
    path === "/books"
      ? [{ label: "図書", icon: BookOpen }]
      : [{ label: "図書", to: "/books", icon: BookOpen }, { label: path === "/fields" ? "入力の例" : "この例について" }];

  return (
    <AppShell
      sidebar={{
        menus: MENUS,
        pathname: path,
        onNavigate: setPath,
        iconFor,
        brandName: "図書の貸出",
        // ロゴを省略できる例。
        collapsed,
        setCollapsed,
        toggle: () => setCollapsed((v) => !v),
        account: {
          user: { username: "例の利用者", email: "user@example.invalid" },
          label: "基本情報",
          selected: false,
          onOpen: () => setPath("/about"),
        },
      }}
      header={{
        crumbs,
        renderLink: ({ to, style, ariaLabel, children }) => (
          <a
            href={to}
            style={style}
            aria-label={ariaLabel}
            onClick={(e) => {
              e.preventDefault();
              setPath(to);
            }}
          >
            {children}
          </a>
        ),
        onToggleSidebar: () => setCollapsed((v) => !v),
        onToggleDarkMode,
      }}
    >
      {path === "/books" ? (
        <BooksPage />
      ) : path === "/fields" ? (
        <FieldsPage />
      ) : (
        <AboutPage onOpenBooks={() => setPath("/books")} />
      )}
    </AppShell>
  );
}

/** 案内のダイアログの画像の例（手順の番号の印を入れた図） */
const GUIDE_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160"><rect width="480" height="160" fill="#f5f5f5"/>' +
    [0, 1, 2]
      .map((i) => `<rect x="${24 + i * 152}" y="40" width="128" height="80" rx="8" fill="#fff" stroke="#d9d9d9"/><text x="${88 + i * 152}" y="90" font-size="28" text-anchor="middle" fill="#1677ff">${"①②③"[i]}</text>`)
      .join("") +
    "</svg>",
)}`;

/** 画像付きのカードの例の画像（紙の形を線で描いた図） */
const slipImage = (lines: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="297" viewBox="0 0 210 297"><rect width="210" height="297" fill="#fff"/>' +
      Array.from({ length: lines }, (_, i) => `<rect x="20" y="${30 + i * 24}" width="170" height="10" fill="#d9d9d9"/>`).join("") +
      "</svg>",
  )}`;

/** 貸出票の形の選択肢（ImageChoiceCards）。画像のない選択肢は「＋」の空の印を出す */
const SLIP_CHOICES: ImageChoice[] = [
  { value: "simple", label: "簡易の貸出票", description: "書名と返却日だけを書く票です。", image: slipImage(3) },
  {
    value: "detail",
    label: "詳しい貸出票",
    description: "書名・返却日のほか、借りた人の連絡先と、貸し出したときの状態を書く票です。説明が長いときは3行で省きます。",
    image: slipImage(9),
  },
  { value: "none", label: "票なし", description: "票を書かずに貸し出します。" },
];

/** 見出し付きのパネル（HeadedCard）、操作を並べるパネル（ActionPanel）、押せる行のリスト（LinkList）の例 */
function AboutPage({ onOpenBooks }: { onOpenBooks: () => void }) {
  const { token } = theme.useToken();
  const kind = useColumnKinds();
  const { message } = App.useApp();
  const notice = useNotice();
  const [progressOpen, setProgressOpen] = useState(false);
  const [progresses, setProgresses] = useState<ProgressItem[]>([]);
  const [slip, setSlip] = useState("simple");
  // 進み具合のダイアログ（ProgressModal）。処理中の1行は、速く終わっても最小表示時間だけ出す（atLeastMin）
  const exportBooks = () => {
    setProgresses([{ key: "export", text: "書き出し中…", percent: 50, status: "running" }]);
    setProgressOpen(true);
    void atLeastMin(Promise.resolve(INITIAL_BOOKS.length)).then((n) =>
      setProgresses([{ key: "export", text: `${n}件の図書を書き出しました。`, percent: 100, status: "done" }]),
    );
  };
  // 追加・保存・削除のほかの操作の知らせは、文を渡す（NoticeTexts）
  const reset = () => {
    const lifecycle = notifyLifecycle<void>(message, "book-reset", {
      loading: "初期化しています…",
      success: "初期化しました",
      error: "初期化できませんでした",
    });
    lifecycle.onMutate?.();
    window.setTimeout(() => lifecycle.onSuccess?.(), WAIT_MS);
  };
  const showHelp = () => notice.info("使い方", "左のメニューの「図書」で、図書を追加・編集・削除できます。");
  // 操作の前に手順を案内するダイアログ（useGuideDialog）。主のボタンで閉じて、続きの操作をする
  const guide = useGuideDialog();
  const showGuide = () =>
    guide(
      {
        title: "貸出の始め方",
        okText: "OK",
        lead: "「OK」を押すと、図書の一覧を開きます。",
        image: { src: GUIDE_IMAGE, alt: "貸出の手順の図" },
        steps: ["一覧で借りる図書を押します。", "「編集」で状態を「貸出中」にします。", "「保存」を押します。"],
      },
      onOpenBooks,
    );
  return (
    <Flex vertical gap={token.margin}>
      <HeadedCard
        title="この例について"
        icon={Info}
        description="パネルの説明の文は、見出しの下に出します。"
        extra={<Button>編集</Button>}
      >
        <Typography.Text>
          chainwip-design-system の部品だけで組んだ例です。データは画面の中だけにあり、再読み込みで最初に戻ります。
        </Typography.Text>
      </HeadedCard>
      <ActionPanel
        title="操作"
        items={[
          { key: "export", description: "図書の一覧を書き出します。", action: <Button onClick={exportBooks}>書き出し</Button> },
          { key: "reset", description: "図書を最初の状態に戻します。", action: <Button onClick={reset}>初期化</Button> },
          { key: "help", description: "この例の使い方を読みます。", action: <Button onClick={showHelp}>使い方</Button> },
          { key: "guide", description: "図書を貸し出す手順を案内します。", action: <Button onClick={showGuide}>貸出の始め方</Button> },
        ]}
      />
      <ProgressModal title="書き出し" progresses={progresses} open={progressOpen} onClose={() => setProgressOpen(false)} />
      <HeadedCard title="最近見た図書">
        <LinkList
          items={INITIAL_BOOKS.slice(0, 3).map((b) => ({ key: b.id, text: b.title, onClick: onOpenBooks }))}
          empty="最近見た図書はありません。"
        />
      </HeadedCard>
      <HeadedCard title="貸出中の図書">
        {/* 行の操作が1つだけの表。右端の「＞」と行を押したときを同じ操作にする */}
        <DataTable<Book>
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { ...kind.long, title: "書名", key: "title", dataIndex: "title" },
            rowOpenColumn<Book>(onOpenBooks, "図書"),
          ]}
          dataSource={INITIAL_BOOKS.filter((b) => b.status === "貸出中")}
          onRow={() => ({ onClick: onOpenBooks })}
        />
      </HeadedCard>
      <HeadedCard title="貸出票の形" description="画像を押すと拡大し、カードの枠を押すと選びます。">
        <ImageChoiceCards options={SLIP_CHOICES} value={slip} onChange={setSlip} />
      </HeadedCard>
      <HeadedCard title="予約した図書">
        <LinkList items={[]} empty="予約した図書はありません。" />
      </HeadedCard>
    </Flex>
  );
}

type BookSearch = ListSearch & { status: string };

/** 貸出中だけ色を付ける（PillTag は区別に要るときだけ色を付ける） */
const statusTag = (s: Book["status"]) => (s === "貸出中" ? <PillTag color="processing">{s}</PillTag> : <PillTag>{s}</PillTag>);

/** 例では送る先がないため、知らせの途中が見えるよう少し待つ */
const WAIT_MS = 300;

function BooksPage() {
  const { message } = App.useApp();
  const kind = useColumnKinds();
  const rowActions = useRowActions();
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [search, setSearchState] = useState<BookSearch>({ ...DEFAULT_LIST_SEARCH, status: "" });
  // 時間の軸の列がないため、withDefaultSort は通さず、配列の順（追加した行が先頭）のままにする
  const setSearch = useCallback((patch: Record<string, unknown>) => setSearchState((s) => ({ ...s, ...patch })), []);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<BookInput>();

  // 絞り込み・並べ替え・ページ送りは、例では画面の中で行う（使う側では API などが行う）
  const filtered = useMemo(() => {
    const rows = books.filter(
      (b) => (!search.keyword || b.title.includes(search.keyword)) && (!search.status || b.status === search.status),
    );
    const field = search.sortField as keyof Book | null;
    if (field) {
      const dir = search.sortOrder === "ascend" ? 1 : -1;
      rows.sort((a, b) => String(a[field]).localeCompare(String(b[field]), "ja") * dir);
    }
    return rows;
  }, [books, search]);
  const pageRows = filtered.slice(search.offset, search.offset + search.limit);

  const list = useListPage<Book>({ search, setSearch, total: filtered.length, rowCount: pageRows.length, isLoading: false });

  const dialog = useFormDialog<Book, BookInput>(form);
  const closeModal = dialog.close;

  /** 例の送り先。途中・終わりの知らせは notifyLifecycle が出す */
  const run = <T,>(lifecycle: MutationLifecycle<T>, values: T, apply: () => void) => {
    setSaving(true);
    lifecycle.onMutate?.(values);
    window.setTimeout(() => {
      apply();
      setSaving(false);
      lifecycle.onSuccess?.(values);
    }, WAIT_MS);
  };

  const save = (input: BookInput) => {
    if (dialog.editing) {
      const id = dialog.editing.id;
      run(notifyLifecycle<BookInput>(message, "book-update", "update", closeModal), input, () =>
        setBooks((bs) => bs.map((b) => (b.id === id ? { ...b, ...input } : b))),
      );
    } else {
      run(notifyLifecycle<BookInput>(message, "book-create", "create", closeModal), input, () =>
        setBooks((bs) => [{ id: `b${Date.now()}`, ...input }, ...bs]),
      );
    }
  };

  const columns = [
    { ...kind.long, ...list.sortable("書名", "title") },
    {
      ...kind.short,
      ...list.sortable("状態", "status"),
      render: (_: unknown, r: Book) => statusTag(r.status),
    },
    {
      ...kind.long,
      title: "分野",
      dataIndex: "genres",
      key: "genres",
      // タグクラウドの欄で選んだ値は、札の並び（PillTagList）で表示だけする
      render: (v: Genre[]) => (v.length ? <PillTagList items={v.map((g) => ({ key: g, label: genreLabel(g) }))} /> : "—"),
    },
    {
      ...kind.long,
      title: "メモ",
      dataIndex: "note",
      key: "note",
      render: (v: string) => v || "—",
    },
    rowActionsColumn((r: Book) => [
      rowActions.edit(() => dialog.openEdit(r, { title: r.title, status: r.status, genres: r.genres, note: r.note })),
      rowActions.remove({ title: "この図書を削除しますか", content: `「${r.title}」を削除します。元に戻せません。` }, () =>
        run(notifyLifecycle<string>(message, "book-delete", "delete"), r.id, () =>
          setBooks((bs) => bs.filter((b) => b.id !== r.id)),
        ),
      ),
    ]),
  ];

  const slots = [
    keywordSlot(list, "書名を検索"),
    selectSlot({
      key: "status",
      placeholder: "状態",
      icon: CircleDot,
      value: search.status,
      onChange: (v) => setSearch({ status: v, offset: 0 }),
      options: BOOK_STATUSES.map((s) => ({ label: s, value: s })),
    }),
  ];

  return (
    <Flex {...list.shellProps}>
      <FilterToolbar
        ref={list.toolbarRowRef}
        slots={slots}
        actions={
          <AddButton onClick={() => dialog.openCreate(EMPTY_BOOK)} />
        }
      />
      <DataTable<Book>
        {...list.tableProps}
        rowKey="id"
        columns={columns}
        dataSource={pageRows}
        locale={{ emptyText: "図書はまだありません。右上の「追加」から足せます。" }}
      />
      <BaseFormModal<BookInput>
        open={dialog.open}
        title={dialog.editing ? "図書の編集" : "図書の追加"}
        okText="保存"
        cancelText="キャンセル"
        form={form}
        confirmLoading={saving}
        onCancel={closeModal}
        onFinish={save}
      >
        <Form.Item name="title" label="書名" rules={[{ required: true, message: "書名を入れてください" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="status" label="状態">
          <Select options={BOOK_STATUSES.map((s) => ({ label: s, value: s }))} />
        </Form.Item>
        <Form.Item name="genres" label="分野">
          <TagCloud<Genre> options={GENRE_GROUPS} placeholder="分野を検索して選ぶ" ariaLabel="分野" />
        </Form.Item>
        <Form.Item name="note" label="メモ">
          <Input.TextArea rows={3} />
        </Form.Item>
      </BaseFormModal>
    </Flex>
  );
}
