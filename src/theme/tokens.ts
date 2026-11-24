import { theme } from "antd";
import type { ConfigProviderProps, ThemeConfig } from "antd";
import type { ThemeValues } from "./designValues";

/**
 * 表の選んだ行の色を、明暗の計算（algorithm）と token から導く（雛形antd-adminのテーマの作りのまま）。
 * 値ではなく「選んだ行は colorFillAlter の色にする」という仕組みのため、ここに残す
 */
export function buildTableTokens(cfg: ThemeConfig) {
  const rowSelectedBg = theme.getDesignToken(cfg).colorFillAlter;
  return {
    rowSelectedBg,
    rowSelectedHoverBg: rowSelectedBg,
  };
}

/** 使う側が渡した明暗の一方の値から、antdの ConfigProvider に渡すテーマを作る */
export function buildThemeConfig(values: ThemeValues, darkMode: boolean): ConfigProviderProps {
  const algorithm = darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm;
  return {
    theme: {
      algorithm,
      token: values.token,
      components: {
        ...values.components,
        Table: {
          ...buildTableTokens({ algorithm, token: values.token }),
          ...values.components.Table,
        },
      },
    },
  };
}
