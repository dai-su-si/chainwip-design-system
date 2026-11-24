import { Button } from "antd";
import { useState } from "react";
import { AppShell, HeadedCard, PanelPage } from "chainwip-design-system";
import { useDemoNavigation } from "./navigation";
import { aboutPath, booksPath, iconFor, menus, routeFor } from "./routes";

export function ExampleApp({ onToggleDarkMode }: { onToggleDarkMode: () => void }) {
  const { url, navigate } = useDemoNavigation();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((value) => !value);
  const route = routeFor(url.pathname);
  const notFoundTitle = "ページが見つかりません";

  return (
    <AppShell
      sidebar={{
        menus,
        pathname: route?.path ?? "",
        onNavigate: navigate,
        iconFor,
        brandName: "図書の貸出",
        collapsed,
        setCollapsed,
        toggle,
        account: {
          user: { username: "例の利用者", email: "user@example.invalid" },
          label: "基本情報",
          selected: false,
          onOpen: () => navigate(aboutPath),
        },
      }}
      header={{
        crumbs: [{ label: route?.label ?? notFoundTitle }],
        renderLink: ({ to, style, ariaLabel, children }) => (
          <a
            href={to}
            style={style}
            aria-label={ariaLabel}
            onClick={(event) => {
              if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              navigate(to);
            }}
          >
            {children}
          </a>
        ),
        onToggleSidebar: toggle,
        onToggleDarkMode,
      }}
    >
      {route ? route.render({ url, navigate }) : (
        <PanelPage>
          <HeadedCard title={notFoundTitle} extra={
            <Button type="primary" onClick={() => navigate(booksPath, true)}>図書一覧に戻る</Button>
          }>
            メニューから画面を選択できます。
          </HeadedCard>
        </PanelPage>
      )}
    </AppShell>
  );
}
