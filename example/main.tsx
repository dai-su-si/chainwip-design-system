import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import jaJP from "antd/locale/ja_JP";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import "@fontsource-variable/noto-sans-jp";
import { ThemeProvider } from "chainwip-design-system";
import type { LayoutTokens } from "chainwip-design-system";
import { ExampleApp } from "./App";
import { normalizeDemoLocation } from "./navigation";

dayjs.locale("ja");
normalizeDemoLocation();

// 画面監査で上書きと既定値の併用を確認する。通常のサンプルは既定値を使う。
const demoSettings = new URLSearchParams(location.search);
const customLayout: LayoutTokens | undefined = demoSettings.get("layout") === "custom"
  ? {
      columns: { shortColumnEm: 8, longColumnMinEm: 10, actionsColumnWidth: 72 },
      spacing: { headingToBody: 28, formLabelGap: 12, formItemGap: 16, betweenActions: 0, betweenPanels: -1 },
    }
  : undefined;

function Root() {
  // 明暗の値の保存は使う側が持つ（例では画面の中だけ）
  const [darkMode, setDarkMode] = useState(false);
  return (
    <ThemeProvider
      darkMode={darkMode}
      locale={jaJP}
      layoutTokens={customLayout}
      panelSaveButtonType={demoSettings.get("save") === "default" ? "default" : undefined}
    >
      <ExampleApp onToggleDarkMode={() => setDarkMode((v) => !v)} />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
