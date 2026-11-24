import { theme } from "antd";
import type { TablePaginationConfig } from "antd/es/table/interface";
import type { SorterResult } from "antd/es/table/interface";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { z } from "zod/v4";
import { currentPathKey, readRowCount } from "./rememberedRowCount";

/**
 * 一覧の検索状態・ページ送り・並べ替え・表の高さを管理する。
 * データの取り方とURLの書き方（ルーター）は知らず、検索の状態（search）と、それを変える関数（setSearch）を使う側から受け取る。
 */

/** 一覧の検索状態。アプリ側で URL と同期できる */
export const ListSearchSchema = z.object({
  limit: z.number().int().positive().catch(100),
  offset: z.number().int().nonnegative().catch(0),
  sortField: z.string().nullable().catch(null),
  sortOrder: z.enum(["ascend", "descend"]).nullable().catch(null),
  keyword: z.string().catch(""),
});
export type ListSearch = z.infer<typeof ListSearchSchema>;

/**
 * 並べ替えの指定がないとき（URLにない、またはほかの画面から DEFAULT_LIST_SEARCH で開いたとき）に、
 * 時間の軸の列の新しい順（降順）にする。URLの並びに入れるため、その列の見出しに並べ替えの印が出る。
 * 各画面の validateSearch で通す。URLで並びを指定して開いたときは、その並びのまま。
 * 時間の軸の列がない表は、この関数を通さず、データの返す順のままにする
 */
export function withDefaultSort<S extends ListSearch>(search: S, timeField: string): S {
  return search.sortField ? search : { ...search, sortField: timeField, sortOrder: "descend" };
}

/** 一覧を最初の状態で開くときの検索の状態（ほかの画面から絞り込みを付けて開くときに使う） */
export const DEFAULT_LIST_SEARCH: ListSearch = ListSearchSchema.parse({});

/** 一覧のAPIへ渡す、ページ送りと並べ替えの値（一覧ごとに同じ形を写していたため、1つにした） */
export function listParams(search: ListSearch) {
  return {
    limit: search.limit,
    offset: search.offset,
    sortField: search.sortField ?? undefined,
    sortOrder: search.sortOrder ?? undefined,
  };
}

type Options = {
  search: ListSearch;
  /** URLの検索の状態を変える（各画面で navigate({ search: { ...search, ...patch } }) を渡す） */
  setSearch: (patch: Partial<ListSearch> & Record<string, unknown>) => void;
  total: number | undefined;
  rowCount: number;
  isLoading: boolean;
  /** 前に読み終えたときの行数を覚えるキー（rememberedRowCount）。既定は今の画面のパス */
  rowCountKey?: string;
};

export function useListPage<T>({ search, setSearch, total, rowCount, isLoading, rowCountKey }: Options) {
  const countKey = rowCountKey ?? currentPathKey();
  const { token } = theme.useToken();
  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const tableFrameRef = useRef<HTMLDivElement>(null);
  const tableAvailableRef = useRef(0);
  /**
   * If both start as undefined on the first frame, the table grows to full row height (flex min-height:auto)
   * and the main content area scrolls. Seed from the viewport; useLayoutEffect then refines.
   */
  const [tableAreaMaxHeight, setTableAreaMaxHeight] = useState<number | undefined>(() =>
    typeof window !== "undefined" ? Math.max(240, Math.floor(window.innerHeight - 280)) : undefined,
  );
  const [tableScrollY, setTableScrollY] = useState<number | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const maxH = Math.max(240, Math.floor(window.innerHeight - 280));
    return Math.max(120, maxH - 40);
  });
  const [keywordInput, setKeywordInput] = useState(search.keyword);
  const currentPage = Math.floor(search.offset / search.limit) + 1;

  useEffect(() => {
    setKeywordInput(search.keyword);
  }, [search.keyword]);

  const applySearch = (keyword: string) => setSearch({ keyword: keyword.trim(), offset: 0 });
  const clearSearch = () => {
    setKeywordInput("");
    applySearch("");
  };

  const showPagination = (total ?? 0) > search.limit;

  useLayoutEffect(() => {
    const shell = pageShellRef.current;
    const toolbarEl = toolbarRowRef.current;
    const mid = middleSectionRef.current;
    if (!shell || !toolbarEl || !mid) return;

    /** Fixed small table header row height */
    const headReserve = 40;
    /** Ant Design Table size="small" row ~39px; slightly higher for Tags / selection column */
    const rowEstimate = 44;
    const paginationBlock = 56;

    let rafRetry = 0;
    const maxRafRetries = 8;

    const measure = () => {
      const toolbarRect = toolbarEl.getBoundingClientRect();
      const mainEl = shell.closest<HTMLElement>(".main-layout-main");
      const mainRect = mainEl?.getBoundingClientRect();
      const viewportBottom =
        typeof window !== "undefined" ? window.innerHeight : Number.POSITIVE_INFINITY;
      const clipBottom = mainRect
        ? mainRect.bottom
        : Math.min(shell.getBoundingClientRect().bottom, viewportBottom);

      const maxMiddleFromShell = Math.max(
        0,
        Math.floor(clipBottom - toolbarRect.bottom - token.marginLG),
      );

      const midHRaw = mid.clientHeight;
      const midH = midHRaw > 0 ? Math.min(midHRaw, maxMiddleFromShell) : maxMiddleFromShell;

      if (maxMiddleFromShell === 0 && rafRetry < maxRafRetries) {
        rafRetry += 1;
        requestAnimationFrame(() => requestAnimationFrame(measure));
        return;
      }

      const frameInner = Math.max(0, Math.floor(midH));
      tableAvailableRef.current = frameInner;

      setTableAreaMaxHeight(frameInner > 0 ? frameInner : undefined);

      const pagReserve = showPagination ? paginationBlock : 0;
      const bodyMax = Math.max(120, frameInner - headReserve - pagReserve);

      // 読み込み中は、前に読み終えたときの行数で高さを決める。覚えていなければ下端まで伸ばす
      const remembered = isLoading && rowCount === 0 ? readRowCount(countKey) : undefined;
      if (isLoading && rowCount === 0 && remembered == null) {
        setTableScrollY(bodyMax);
        return;
      }
      const rows = remembered ?? rowCount;

      if (rows === 0) {
        setTableScrollY(undefined);
        return;
      }

      const naturalBodyH = headReserve + rows * rowEstimate;
      const naturalTotalH = naturalBodyH + pagReserve;
      const slack = 12;

      if (naturalTotalH + slack > frameInner) {
        setTableScrollY(bodyMax);
        return;
      }

      setTableScrollY(undefined);
      requestAnimationFrame(() => {
        const frame = tableFrameRef.current;
        const avail = tableAvailableRef.current;
        const minFrame = headReserve + pagReserve;
        if (!frame || avail <= minFrame) return;
        if (frame.scrollHeight > frame.clientHeight + 1) {
          setTableScrollY(Math.max(120, avail - headReserve - pagReserve));
        }
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(shell);
    ro.observe(mid);
    return () => ro.disconnect();
  }, [showPagination, rowCount, isLoading, countKey, token.marginLG]);

  const pagination: false | TablePaginationConfig = useMemo(
    () =>
      showPagination
        ? {
            total: total ?? 0,
            current: currentPage,
            pageSize: search.limit,
            showSizeChanger: true,
            showTotal: (n) => `${n}件`,
            onChange: (page, pageSize) =>
              setSearch({
                limit: pageSize ?? search.limit,
                offset: (page - 1) * (pageSize ?? search.limit),
              }),
          }
        : false,
    [showPagination, total, currentPage, search.limit, setSearch],
  );

  /** 列の並べ替えの印の状態（URLの sortField・sortOrder から決める） */
  const sortOrderFor = (field: string) => (search.sortField === field ? search.sortOrder : null);
  /** 並べ替えられる列の、題・値の名前・並べ替えの印（題と値の名前が1対1の列に使う） */
  const sortable = (title: string, field: string) => ({
    title,
    dataIndex: field,
    key: field,
    sorter: true,
    sortOrder: sortOrderFor(field),
  });

  /** DataTable にそのまま渡す props（デモのUsersの DataTable の props と同じ） */
  const tableProps = {
    layoutRef: middleSectionRef,
    frameRef: tableFrameRef,
    lockScrollHeight: tableScrollY != null,
    maxHeight: tableAreaMaxHeight,
    frameHeight: tableScrollY != null && tableAreaMaxHeight != null ? tableAreaMaxHeight : undefined,
    size: "small" as const,
    loading: isLoading,
    rowCountKey: countKey,
    pagination,
    style: { flex: 1, minHeight: 0 },
    // 横は指定しない（デモのUsersは x: "max-content"）。表を見える幅いっぱいにし、長い値の列が
    // 短い値と操作の列の残りを分け合って「…」で省くため。max-contentでは、長い値の全文の幅まで表が広がる
    scroll: tableScrollY != null ? { y: tableScrollY } : undefined,
    onChange: (_p: unknown, _f: unknown, sorter: SorterResult<T> | SorterResult<T>[]) => {
      if (Array.isArray(sorter)) return;
      // 並べ替えを外す状態は作らず、押すたびに新しい順と古い順を入れ替える。antdは降順の次を「外す」にするため、
      // 外したら同じ列の昇順にする。外して開いたときの並び（降順）に戻すと、既定の列が降順のまま変わらないため。
      // 外したときのantdの値には列の名前が入らないため、今の並びの列を使う（外せるのは今の並びの列だけ）。
      // デモは外したら並べ替えの列（username）の降順に戻していた
      setSearch(
        sorter.order
          ? { sortField: String(sorter.field ?? sorter.columnKey), sortOrder: sorter.order }
          : { sortField: search.sortField, sortOrder: "ascend" },
      );
    },
  };

  /** 一覧の画面の外枠（Flex）に渡す props。表の高さを測る基準になる */
  const shellProps = {
    ref: pageShellRef,
    vertical: true,
    gap: token.marginMD,
    style: { flex: "1 1 0%", minHeight: 0, overflow: "hidden" as const },
  };

  return {
    toolbarRowRef,
    shellProps,
    tableProps,
    sortOrderFor,
    sortable,
    keywordInput,
    setKeywordInput,
    applySearch,
    clearSearch,
  };
}
