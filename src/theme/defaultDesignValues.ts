// 標準画面の共通設定。ThemeProvider が内部の部品に渡す。
import type { DesignValues } from "./designValues";

/** 文字の書体。先頭の Noto Sans JP Variable は、使う側が書体のファイル（@fontsource-variable/noto-sans-jp）を読み込んだときだけ効き、なければ後ろの書体になる */
const FONT_FAMILY =
  "'Noto Sans JP Variable', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Yu Gothic UI', 'Hiragino Sans', 'Meiryo', 'Noto Sans JP', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";

/** 明暗で同じantdの token */
const SHARED_TOKEN = {
  // 文字の基準の大きさ（px）
  fontSize: 16,
  fontFamily: FONT_FAMILY,
  // 角の丸み（標準・小・大、px）。雛形antd-adminの値
  borderRadius: 8,
  borderRadiusSM: 6,
  borderRadiusLG: 12,
};

/** 明暗共通の入力部品のトークン */
const CONTROL_COMPONENTS = {
  Button: { primaryShadow: "none", defaultShadow: "none", dangerShadow: "none" },
  Input: { activeShadow: "none" },
  Form: {
    // ラベルの下端からフィールドの表示領域までの間隔。
    verticalLabelPadding: "0 0 8px",
    itemMarginBottom: 20,
  },
};

export const defaultDesignValues: DesignValues = {
  theme: {
    light: {
      // 画面の地の色（明）
      token: { colorBgLayout: "#ffffff", ...SHARED_TOKEN },
      components: {
        ...CONTROL_COMPONENTS,
        // サイドメニューの項目の色（明。雛形antd-adminの値）
        Menu: {
          itemSelectedBg: "rgba(0, 0, 0, 0.06)",
          itemSelectedColor: "rgba(0, 0, 0, 0.88)",
          subMenuItemSelectedColor: "rgba(0, 0, 0, 0.88)",
          itemHoverBg: "rgba(0, 0, 0, 0.04)",
          itemHoverColor: "rgba(0, 0, 0, 0.88)",
          itemActiveBg: "rgba(0, 0, 0, 0.08)",
          itemBorderRadius: SHARED_TOKEN.borderRadiusSM,
          itemMarginInline: 8,
          horizontalItemSelectedColor: "rgba(0, 0, 0, 0.88)",
          horizontalItemHoverColor: "rgba(0, 0, 0, 0.88)",
        },
      },
    },
    dark: {
      token: { ...SHARED_TOKEN },
      components: {
        ...CONTROL_COMPONENTS,
        // サイドメニューの項目の色（暗。並びは明と同じ）
        Menu: {
          itemSelectedBg: "rgba(255, 255, 255, 0.08)",
          itemSelectedColor: "rgba(255, 255, 255, 0.85)",
          subMenuItemSelectedColor: "rgba(255, 255, 255, 0.85)",
          itemHoverBg: "rgba(255, 255, 255, 0.06)",
          itemHoverColor: "rgba(255, 255, 255, 0.85)",
          itemActiveBg: "rgba(255, 255, 255, 0.1)",
          itemBorderRadius: SHARED_TOKEN.borderRadiusSM,
          itemMarginInline: 8,
          horizontalItemSelectedColor: "rgba(255, 255, 255, 0.85)",
          horizontalItemHoverColor: "rgba(255, 255, 255, 0.85)",
        },
      },
    },
  },
  scrollbar: {
    size: 8,
    thumbInset: 2,
    radius: 9999,
    light: { track: "rgba(0, 0, 0, 0)", thumb: "rgba(0, 0, 0, 0.22)", thumbHover: "rgba(0, 0, 0, 0.38)" },
    dark: { track: "rgba(255, 255, 255, 0)", thumb: "rgba(255, 255, 255, 0.22)", thumbHover: "rgba(255, 255, 255, 0.38)" },
  },
  frame: {
    sidebarWidth: 240,
    sidebarCollapsedWidth: 64,
    drawerWidth: 320,
    drawerMaskOpacity: 0.5,
    brandRowMinHeight: 64,
    brandBoxSize: 40,
    logoSize: 24,
    groupDotSize: 6,
    userMenuLineGap: 2,
  },
  list: {
    shortColumnEm: 9,
    longColumnMinEm: 7,
    actionsColumnWidth: 60,
    filterControlWidth: 220,
    moreFiltersReserve: 40,
    filterPopoverMaxWidth: 360,
    filterPopoverViewportGutter: 32,
    pillRadius: 9999,
    empty: { maxWidth: 360, iconBoxSize: 44, iconSize: 22, iconStrokeWidth: 1.75 },
  },
  panel: {
    pageGutter: 16,
    betweenPanels: 16,
    headingToBody: 24,
    betweenActions: 16,
    relatedContent: 8,
  },
  // 開始・終了時刻の入力欄（Col span 8、Row gutter token.margin）、複数行の文の欄で最も多い行数（2〜6）、
  // 日付（YYYY-MM-DD（dd））・月（MONTH_PICKER_FORMAT）・時刻（HH:mm）の表示書式
  field: {
    pairColumnSpan: 8,
    pairGapToken: "margin",
    textAreaRows: { minRows: 2, maxRows: 6 },
    formats: { date: "YYYY-MM-DD（dd）", month: "YYYY年M月", time: "HH:mm" },
  },
  imageChoiceCards: {
    minCardWidth: 220,
    imageHeight: 160,
    descriptionRows: 3,
    checkMarkSize: 20,
  },
  // antdの Modal の既定と同じ幅（modal.info の既定416pxでは狭いため）
  guideDialog: { width: 520 },
  // antdの既定の「*」と同じ印と間（4px）で、項目名の後ろに出す
  requiredMark: { text: "*", gapToken: "marginXXS", fontSizeToken: "fontSize" },
};
