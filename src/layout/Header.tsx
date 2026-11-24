// 画面の上の行（ヘッダー）: 左にサイドメニューの開閉（992px未満）とパンくず、右に表示の明暗の切り替え。
// パンくずの項目（crumbs）とリンクの部品（renderLink。使う側のルーターの Link）、ボタンを押したときの処理は使う側が渡す。
import { Layout, Button, Space, theme, Breadcrumb, Flex, Divider, Grid } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import type { CSSProperties, ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { Theme } from "../icons/Theme";
import type { Crumb } from "./menu";
import "./Header.css";

const { Header: AntHeader } = Layout;

/** パンくずの戻り先のリンク。使う側のルーターの Link を返す */
export type RenderCrumbLink = (props: {
  to: string;
  style: CSSProperties;
  ariaLabel?: string;
  children: ReactNode;
}) => ReactNode;

export type HeaderProps = {
  crumbs: Crumb[];
  renderLink: RenderCrumbLink;
  onToggleSidebar: () => void;
  onToggleDarkMode: () => void;
};

export function Header({ crumbs, renderLink, onToggleSidebar, onToggleDarkMode }: HeaderProps) {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;

  const breadcrumbItems: ItemType[] = crumbs.map((crumb, index) => {
    const label = <span title={crumb.label}>{crumb.label}</span>;
    return {
      title: crumb.to ? (
        renderLink({ to: crumb.to, style: { color: "inherit" }, children: label })
      ) : (
        <span aria-current={index === crumbs.length - 1 ? "page" : undefined}>{label}</span>
      ),
    };
  });

  const showBreadcrumb = breadcrumbItems.length > 0;

  return (
    <AntHeader
      style={{
        background: "transparent",
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        padding: `0 ${token.padding}px`,
        gap: token.sizeLG,
        display: "flex",
      }}
    >
      <Flex align="center" flex={1} style={{ minWidth: 0 }}>
        {isMobile ? (
          <Button
            type="text"
            size="small"
            onClick={onToggleSidebar}
            icon={<PanelLeft size={token.size} />}
            aria-label="サイドメニューの開閉"
          />
        ) : null}
        {showBreadcrumb ? (
          <>
            {isMobile ? <Divider vertical /> : null}
            <Breadcrumb className="chainwip-breadcrumb" aria-label="パンくず" items={breadcrumbItems} />
          </>
        ) : null}
      </Flex>
      <Space>
        <Button
          type="text"
          onClick={onToggleDarkMode}
          icon={<Theme size={token.size} />}
          aria-label="表示の明暗の切り替え"
        />
      </Space>
    </AntHeader>
  );
}
