// 見た目の値の型と、部品がそれを読む口。既定の値は defaultDesignValues.ts に1組だけ置き、
// 使う側は ThemeProvider の values に変えたいまとまりだけを渡して上書きする。
import { createContext, useContext } from "react";
import type { GlobalToken, ThemeConfig } from "antd";

/** antdのテーマのうち、明暗のどちらか一方の値。algorithm（明暗の計算）は ThemeProvider が決める */
export type ThemeValues = {
  /** antdの token の上書き（例: fontSize、fontFamily、borderRadius、colorBgLayout） */
  token: NonNullable<ThemeConfig["token"]>;
  /** antdの部品ごとの token の上書き（例: Button、Input、Menu）。Table の選んだ行の色は ThemeProvider が token から導く */
  components: NonNullable<ThemeConfig["components"]>;
};

/** スクロールバーの色（CSSの色の文字） */
export type ScrollbarColors = {
  track: string;
  thumb: string;
  thumbHover: string;
};

/** antdの token のうち、値が数のものの名前（例: marginXXS、fontSize） */
export type NumericTokenName = { [K in keyof GlobalToken]-?: GlobalToken[K] extends number ? K : never }[keyof GlobalToken];

export type DesignValues = {
  /** 明と暗のantdのテーマ */
  theme: { light: ThemeValues; dark: ThemeValues };
  /** スクロールバー。ThemeProvider がCSS変数にし、global.css がそれを読む */
  scrollbar: {
    /** 太さ（px） */
    size: number;
    /** つまみの周りの透明な縁（px）。つまみは太さからこの分だけ細く見える */
    thumbInset: number;
    /** 溝とつまみの角の丸み（px） */
    radius: number;
    light: ScrollbarColors;
    dark: ScrollbarColors;
  };
  /** 画面の枠（サイドメニュー・ヘッダー・利用者の欄） */
  frame: {
    /** サイドメニューの幅（px） */
    sidebarWidth: number;
    /** 畳んだサイドメニューの幅（px） */
    sidebarCollapsedWidth: number;
    /** 狭い画面で開くサイドメニュー（Drawer）の幅（px） */
    drawerWidth: number;
    /** Drawerの後ろの暗い幕の不透明度 */
    drawerMaskOpacity: number;
    /** サイドメニューの上のロゴの行の高さの下限（px） */
    brandRowMinHeight: number;
    /** ロゴと開閉のボタンを置く枠の大きさ（px）。畳んだときの四角の一辺と、行の高さの下限 */
    brandBoxSize: number;
    /** ロゴの画像の大きさ（px） */
    logoSize: number;
    /** 畳んだときのメニューのまとまりの印（丸）の大きさ（px） */
    groupDotSize: number;
    /** 狭い画面のパンくずの、今いる画面の名前の幅の上限（文字の大きさの何倍か） */
    crumbMaxWidthEm: number;
    /** パンくずのアイコンの不透明度 */
    crumbIconOpacity: number;
    /** 利用者の欄の名前とメールの間（px） */
    userMenuLineGap: number;
  };
  /** 一覧管理画面 */
  list: {
    /** 短い値の列の幅（文字の大きさの何倍か） */
    shortColumnEm: number;
    /** 長い値の列の幅の下限（文字の大きさの何倍か） */
    longColumnMinEm: number;
    /** 操作の列の幅（px） */
    actionsColumnWidth: number;
    /** 絞り込みの欄（検索・選択・年月）の幅（px） */
    filterControlWidth: number;
    /** 「ほかの絞り込み」のボタンのために空けておく幅（px） */
    moreFiltersReserve: number;
    /** 「ほかの絞り込み」の吹き出しの幅の上限（px） */
    filterPopoverMaxWidth: number;
    /** 「ほかの絞り込み」の吹き出しを、画面の幅からこの分（px）だけ狭くする */
    filterPopoverViewportGutter: number;
    /** 区分・状態の札（PillTag）の角の丸み（px） */
    pillRadius: number;
    /** 空の表の案内 */
    empty: {
      /** 案内の幅の上限（px） */
      maxWidth: number;
      /** アイコンの下地の四角の一辺（px） */
      iconBoxSize: number;
      /** アイコンの大きさ（px） */
      iconSize: number;
      /** アイコンの線の太さ */
      iconStrokeWidth: number;
    };
  };
  /** 編集の枠 */
  edit: {
    /** 普通の画面（EditPage）の段と列の間（px） */
    pageGutter: number;
  };
  /** 原子の欄（src/fields/ の TextField・RangeField など） */
  field: {
    /** 開始と終了の組の1つの欄の幅（antdの24の段のうちの段の数）。8で幅1/3。3つ目の場所（組に付く操作）も同じ幅 */
    pairColumnSpan: number;
    /** 開始と終了の組の欄の間（antdの token の名前） */
    pairGapToken: NumericTokenName;
    /** 複数行の文の欄の既定の行数（最小と最大。間は文の長さで伸び縮みする） */
    textAreaRows: { minRows: number; maxRows: number };
    /** 日付・月・時刻の欄の表示の形（dayjs の書式） */
    formats: { date: string; month: string; time: string };
  };
  /** 画像付きのカードから1つを選ぶ欄（ImageChoiceCards） */
  imageChoiceCards: {
    /** カード1枚の最小の幅（px）。行の幅を、この幅以上の同じ幅のカードで分ける */
    minCardWidth: number;
    /** カードの上の画像の枠の高さ（px）。画像はこの高さに収める */
    imageHeight: number;
    /** 説明の最大の行数（超えたら「…」で省く） */
    descriptionRows: number;
    /** 選んだ印と拡大の印の丸の大きさ（px） */
    checkMarkSize: number;
  };
  /** 操作の前に手順を案内するダイアログ（useGuideDialog） */
  guideDialog: {
    /** ダイアログの幅（px） */
    width: number;
  };
  /** 必須の欄の印（requiredMark。項目名の後ろに危険の色で出す） */
  requiredMark: {
    /** 印の文字 */
    text: string;
    /** 項目名と印の間（antdの token の名前） */
    gapToken: NumericTokenName;
    /** 印の文字の大きさ（antdの token の名前） */
    fontSizeToken: NumericTokenName;
  };
};

export const DesignValuesContext = createContext<DesignValues | null>(null);

/** 見た目の値（既定の値に、ThemeProvider に渡した値を重ねたもの）を読む。ThemeProvider の外で呼んだら止める（antdの App も外にあるため） */
export function useDesignValues(): DesignValues {
  const values = useContext(DesignValuesContext);
  if (!values) throw new Error("useDesignValues: ThemeProvider の中で使ってください");
  return values;
}
