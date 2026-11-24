import { theme } from "antd";
import type { ConfigProviderProps, ThemeConfig } from "antd";
import type { DesignValues, ThemeValues } from "./designValues";

/**
 * 表の選んだ行の色を、明暗の計算（algorithm）と token から導く（雛形antd-adminのテーマの作りのまま）。
 * 値ではなく「選んだ行は colorFillAlter の色にする」という仕組みのため、ここに残す
 */
function buildTableTokens(cfg: ThemeConfig) {
  const rowSelectedBg = theme.getDesignToken(cfg).colorFillAlter;
  return {
    rowSelectedBg,
    rowSelectedHoverBg: rowSelectedBg,
  };
}

/** 共通の設定、フォームの余白、ブランドの主色から Ant Design のテーマを作る */
export function buildThemeConfig(
  values: ThemeValues,
  form: DesignValues["form"],
  darkMode: boolean,
  primaryColor?: string,
): ConfigProviderProps {
  const algorithm = darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm;
  const token = primaryColor === undefined ? values.token : { ...values.token, colorPrimary: primaryColor };
  return {
    theme: {
      algorithm,
      token,
      components: {
        ...values.components,
        Form: {
          ...values.components.Form,
          verticalLabelPadding: `0 0 ${form.labelGap}px`,
          itemMarginBottom: form.itemGap,
        },
        Table: {
          ...buildTableTokens({ algorithm, token }),
          ...values.components.Table,
        },
      },
    },
  };
}
