// 画面の枠: 左にサイドメニュー、右の上にヘッダー、その下に画面の中身（雛形antd-adminのMainLayoutのまま）。
// 中身（例: ルーターの Outlet）は children で渡す。
// 中身の領域の class「main-layout-main」は、一覧の表の高さの測り方（useListPage）が基準にするため変えない。
import { Layout, theme, Flex } from "antd";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import type { SidebarProps } from "./Sidebar";
import { Header } from "./Header";
import type { HeaderProps } from "./Header";

const { Content } = Layout;

export type AppShellProps = {
  sidebar: SidebarProps;
  header: HeaderProps;
  children: ReactNode;
};

export function AppShell({ sidebar, header, children }: AppShellProps) {
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar {...sidebar} />
      <Flex
        vertical
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: "100vh",
        }}
      >
        <Header {...header} />
        <Content
          className="main-layout-main"
          style={{
            flex: 1,
            padding: token.paddingLG,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Flex>
    </Layout>
  );
}
