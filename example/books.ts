// 例のデータ（図書の貸出）。業務と関係ない架空の値で、画面の中の useState の配列だけで動かす。
export const BOOK_STATUSES = ["貸出可", "貸出中", "修理中"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/** 図書の分野の選択肢（タグクラウドの欄 TagCloud の例。まとまりに分ける） */
export const GENRE_GROUPS = [
  { label: "自然", options: [{ value: "garden", label: "園芸" }, { value: "astro", label: "天文" }, { value: "sea", label: "海の生き物" }] },
  { label: "暮らし", options: [{ value: "cook", label: "料理" }, { value: "craft", label: "工作" }] },
  { label: "乗り物", options: [{ value: "rail", label: "鉄道" }] },
] as const;
export type Genre = (typeof GENRE_GROUPS)[number]["options"][number]["value"];
const GENRE_LABEL = new Map<string, string>(GENRE_GROUPS.flatMap((g) => g.options.map((o) => [o.value, o.label] as const)));
export const genreLabel = (g: Genre) => GENRE_LABEL.get(g) ?? g;

export type Book = { id: string; title: string; status: BookStatus; genres: Genre[]; note: string };
export type BookInput = Omit<Book, "id">;

export const EMPTY_BOOK: BookInput = { title: "", status: "貸出可", genres: [], note: "" };

export const INITIAL_BOOKS: Book[] = [
  { id: "b1", title: "はじめての園芸", genres: ["garden"], status: "貸出可", note: "" },
  { id: "b2", title: "星の見つけ方", genres: ["astro"], status: "貸出中", note: "返却は来週の予定" },
  { id: "b3", title: "やさしい料理の本", genres: ["cook"], status: "修理中", note: "表紙の補修" },
  { id: "b4", title: "世界の鉄道", genres: ["rail"], status: "貸出可", note: "" },
  { id: "b5", title: "海の生き物図鑑", genres: ["sea"], status: "貸出中", note: "" },
  { id: "b6", title: "折り紙の遊び方", genres: ["craft"], status: "貸出可", note: "付録の紙は別置き" },
];
