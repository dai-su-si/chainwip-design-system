import { theme } from "antd";
import type { ConfigProviderProps, ThemeConfig } from "antd";
import type { ThemeValues } from "./designValues";

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

/** 共通の設定とブランドの主色から、Ant Design のテーマを作る */
export function buildThemeConfig(values: ThemeValues, darkMode: boolean, primaryColor?: string): ConfigProviderProps {
  const algorithm = darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm;
  const token = primaryColor === undefined ? values.token : { ...values.token, colorPrimary: primaryColor };
  return {
    theme: {
      algorithm,
      token,
      components: {
        ...values.components,
        Table: {
          ...buildTableTokens({ algorithm, token }),
          ...values.components.Table,
        },
      },
    },
  };
}
