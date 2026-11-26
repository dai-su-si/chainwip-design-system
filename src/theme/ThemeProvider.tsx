// テーマの入口。antdの ConfigProvider（明暗のテーマのtoken）と App（message・modal を使うため）を置き、
// html の data-theme を明暗に合わせる（使う側のCSSの html[data-theme="dark"] のため）。
// 共通の表示設定を使い、ブランドの主色は primaryColor で指定できる。
// 明暗の値の保存（どちらを選んだか）は使う側が持ち、darkMode で渡す。切り替えのボタンは Header にある。
// 書体のファイルの読み込み（既定の書体なら @fontsource-variable/noto-sans-jp）は使う側が行う。読み込まなければ後ろの書体になる。
import { App, ConfigProvider } from "antd";
import type { ConfigProviderProps } from "antd";
import { useEffect, useLayoutEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { buildThemeConfig } from "./tokens";
import { DesignValuesContext, PanelSaveButtonTypeContext } from "./designValues";
import type { PanelSaveButtonType } from "./designValues";
import { resolveLayoutTokens } from "./layoutTokens";
import type { LayoutTokens } from "./layoutTokens";
import { requiredMark } from "../fields/RequiredMark";
import "./global.css";

export type ThemeProviderProps = {
  darkMode: boolean;
  /** ブランドの主色。省略時は Ant Design の既定色を使う */
  primaryColor?: string;
  /** アプリ共通の列幅と余白。未指定の項目は共通の既定値を使う。 */
  layoutTokens?: LayoutTokens;
  /** パネル内の保存ボタンの共通表示。省略時は primary。 */
  panelSaveButtonType?: PanelSaveButtonType;
  /** antdのロケール（例: ja_JP）。画面の言葉は使う側が決めるため、渡してもらう */
  locale?: ConfigProviderProps["locale"];
  children: ReactNode;
};

export function ThemeProvider({
  darkMode,
  primaryColor,
  layoutTokens,
  panelSaveButtonType,
  locale,
  children,
}: ThemeProviderProps) {
  const values = useMemo(() => resolveLayoutTokens(layoutTokens), [layoutTokens]);
  const { theme, form, scrollbar } = values;
  const configProviderProps = useMemo(
    () => buildThemeConfig(darkMode ? theme.dark : theme.light, form, darkMode, primaryColor),
    [theme, form, darkMode, primaryColor],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // スクロールバーの値をCSS変数にする（global.css が読む）。描く前に置くため useLayoutEffect にする
  useLayoutEffect(() => {
    const colors = darkMode ? scrollbar.dark : scrollbar.light;
    const style = document.documentElement.style;
    style.setProperty("--app-scrollbar-size", `${scrollbar.size}px`);
    style.setProperty("--app-scrollbar-thumb-inset", `${scrollbar.thumbInset}px`);
    style.setProperty("--app-scrollbar-radius", `${scrollbar.radius}px`);
    style.setProperty("--app-scrollbar-track", colors.track);
    style.setProperty("--app-scrollbar-thumb", colors.thumb);
    style.setProperty("--app-scrollbar-thumb-hover", colors.thumbHover);
  }, [darkMode, scrollbar]);

  return (
    <DesignValuesContext.Provider value={values}>
      {/* autoInsertSpace: 2文字の漢字のボタン（出勤・保存など）に空白が入らないようにする。
          requiredMark: 必須の印を項目名の後ろに出す */}
      <ConfigProvider
        {...configProviderProps}
        locale={locale}
        button={{ autoInsertSpace: false }}
        form={{ requiredMark }}
      >
        <PanelSaveButtonTypeContext.Provider value={panelSaveButtonType}>
          <App>{children}</App>
        </PanelSaveButtonTypeContext.Provider>
      </ConfigProvider>
    </DesignValuesContext.Provider>
  );
}
