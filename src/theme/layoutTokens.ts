import { defaultDesignValues } from "./defaultDesignValues";
import type { DesignValues } from "./designValues";

/** アプリ全体で上書きできる列幅と余白。指定しない値には共通の既定値を使う。 */
export type LayoutTokens = {
  columns?: Partial<Pick<DesignValues["list"], "shortColumnEm" | "longColumnMinEm" | "actionsColumnWidth">>;
  spacing?: Partial<DesignValues["panel"]> & {
    /** フォームのラベルから欄までの間隔（px） */
    formLabelGap?: number;
    /** フォームの欄同士の間隔（px） */
    formItemGap?: number;
  };
};

function width(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

function gap(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function resolveLayoutTokens(layoutTokens?: LayoutTokens): DesignValues {
  if (!layoutTokens) return defaultDesignValues;

  const { columns, spacing } = layoutTokens;
  const { list, panel, form } = defaultDesignValues;
  return {
    ...defaultDesignValues,
    list: {
      ...list,
      shortColumnEm: width(columns?.shortColumnEm, list.shortColumnEm),
      longColumnMinEm: width(columns?.longColumnMinEm, list.longColumnMinEm),
      actionsColumnWidth: width(columns?.actionsColumnWidth, list.actionsColumnWidth),
    },
    panel: {
      pageGutter: gap(spacing?.pageGutter, panel.pageGutter),
      betweenPanels: gap(spacing?.betweenPanels, panel.betweenPanels),
      headingToBody: gap(spacing?.headingToBody, panel.headingToBody),
      betweenActions: gap(spacing?.betweenActions, panel.betweenActions),
      relatedContent: gap(spacing?.relatedContent, panel.relatedContent),
    },
    form: {
      labelGap: gap(spacing?.formLabelGap, form.labelGap),
      itemGap: gap(spacing?.formItemGap, form.itemGap),
    },
  };
}
