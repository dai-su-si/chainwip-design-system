import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import jaJP from "antd/locale/ja_JP";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import "@fontsource-variable/noto-sans-jp";
import { ThemeProvider } from "chainwip-design-system";
import { ExampleApp } from "./App";

dayjs.locale("ja");

function Root() {
  // 明暗の値の保存は使う側が持つ（例では画面の中だけ）
  const [darkMode, setDarkMode] = useState(false);
  // 見た目の値は渡さず、chainwip-design-system の既定の値だけで出す
  return (
    <ThemeProvider darkMode={darkMode} locale={jaJP}>
      <ExampleApp onToggleDarkMode={() => setDarkMode((v) => !v)} />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
