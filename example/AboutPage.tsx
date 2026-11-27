import { useState } from "react";
import {
  ActionPanel,
  DataTable,
  HeadedCard,
  ImageChoiceCards,
  PanelGroup,
  PanelPage,
  ProgressModal,
  atLeastMin,
  rowOpenColumn,
  useColumnKinds,
  useConfirmDanger,
  useGuideDialog,
  useNotice,
} from "chainwip-design-system";
import type { ImageChoice, ProgressItem } from "chainwip-design-system";
import { INITIAL_BOOKS } from "./books";
import type { Book } from "./books";

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
    description: "書名・返却日のほか、借りた人の連絡先と、貸し出したときの状態を書く票です。",
    image: slipImage(9),
  },
  { value: "none", label: "票なし", description: "票を書かずに貸し出します。" },
];

function BookListPanel({ title, books, empty, onOpenBooks }: {
  title: string;
  books: Book[];
  empty: string;
  onOpenBooks: () => void;
}) {
  const kind = useColumnKinds();
  return (
    <HeadedCard title={title}>
      <DataTable<Book>
        rowKey="id"
        size="small"
        pagination={false}
        columns={[
          { ...kind.long, title: "書名", key: "title", dataIndex: "title" },
          rowOpenColumn<Book>(onOpenBooks, (book) => `図書一覧を開く（${book.title}）`),
        ]}
        dataSource={books}
        locale={{ emptyText: empty }}
        onRow={() => ({ onClick: onOpenBooks })}
      />
    </HeadedCard>
  );
}

export function AboutPage({ onOpenBooks }: { onOpenBooks: () => void }) {
  const notice = useNotice();
  const confirmDanger = useConfirmDanger();
  const [recentBooks, setRecentBooks] = useState(() => INITIAL_BOOKS.slice(0, 3));
  const [progressOpen, setProgressOpen] = useState(false);
  const [progresses, setProgresses] = useState<ProgressItem[]>([]);
  const [slip, setSlip] = useState("simple");
  // 進み具合のダイアログ（ProgressModal）。処理中の1行は、速く終わっても最小表示時間だけ出す（atLeastMin）
  const exportBooks = () => {
    setProgresses([{ key: "export", text: "書き出し中…", percent: 50, status: "running" }]);
    setProgressOpen(true);
    void atLeastMin(Promise.resolve()).then(() => {
      const rows = [["書名", "状態"], ...INITIAL_BOOKS.map((book) => [book.title, book.status])];
      const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
      const download = document.createElement("a");
      download.href = url;
      download.download = "図書一覧.csv";
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setProgresses([{ key: "export", text: `${INITIAL_BOOKS.length}件の図書を書き出しました。`, percent: 100, status: "done" }]);
    });
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
    <PanelPage>
      <HeadedCard title="この例について">
        <p>
          chainwip-design-system の部品だけで組んだ例です。データは画面の中だけにあり、再読み込みで最初に戻ります。
        </p>
      </HeadedCard>
      <ActionPanel
        title="操作"
        primaryActionKey="export"
        items={[
          {
            key: "export",
            description: "サンプル図書をCSVで書き出します。",
            label: "書き出し",
            onClick: exportBooks,
            loading: progresses.some((item) => item.status === "running"),
          },
          { key: "help", description: "この例の使い方を読みます。", label: "使い方", onClick: showHelp },
          { key: "guide", description: "図書を貸し出す手順を案内します。", label: "貸出の始め方", onClick: showGuide },
          {
            key: "clear-history",
            description: "最近見た図書の履歴を消去します。",
            label: "閲覧履歴を消去",
            danger: true,
            disabled: recentBooks.length === 0,
            onClick: () => confirmDanger({
              title: "閲覧履歴を消去しますか？",
              content: "最近見た図書の一覧から履歴を消去します。",
              okText: "消去",
            }, () => setRecentBooks([])),
          },
        ]}
      />
      <ProgressModal title="書き出し" progresses={progresses} open={progressOpen} onClose={() => setProgressOpen(false)} />
      <PanelGroup columns={3}>
        <BookListPanel title="最近見た図書" books={recentBooks} empty="最近見た図書はありません。" onOpenBooks={onOpenBooks} />
        <BookListPanel title="貸出中の図書" books={INITIAL_BOOKS.filter((b) => b.status === "貸出中")} empty="貸出中の図書はありません。" onOpenBooks={onOpenBooks} />
        <BookListPanel title="予約した図書" books={[]} empty="予約した図書はありません。" onOpenBooks={onOpenBooks} />
      </PanelGroup>
      <HeadedCard title="貸出票の形">
        <ImageChoiceCards options={SLIP_CHOICES} value={slip} onChange={setSlip} hint="画像を押すと拡大し、カードの枠を押すと選びます。" />
      </HeadedCard>
    </PanelPage>
  );
}
