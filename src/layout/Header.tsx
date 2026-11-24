// 画面の上の行（ヘッダー）: 左にサイドメニューの開閉（992px未満）とパンくず、右に表示の明暗の切り替え。
// パンくずの項目（crumbs）とリンクの部品（renderLink。使う側のルーターの Link）、ボタンを押したときの処理は使う側が渡す。
import { Layout, Button, Space, theme, Breadcrumb, Flex, Divider, Grid, Typography } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import type { CSSProperties, ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { Theme } from "../icons/Theme";
import type { Crumb } from "./menu";
import { useDesignValues } from "../theme/designValues";

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
  const { frame } = useDesignValues();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;

  const rowStyle = {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: token.marginXS,
    color: "inherit" as const,
  };

  // パンくずの項目は使う側がURLから作って渡す。アイコンはデモと同じく、ホームと一覧の項目に付ける。
  // 576px未満（antdの`sm`未満）では、パンくずを1行に収める。幅390で「ホーム / 一覧の名前 / 長い詳細の名前」が
  // 3行に折り返し、1行目がヘッダーの上で切れたため。
  // 戻り先（リンク）の項目はアイコンだけにし、今いる画面の名前は文字の大きさの frame.crumbMaxWidthEm 倍で「…」に省く（全文はマウスを載せると出る）
  const compact = !screens.sm;
  const breadcrumbItems: ItemType[] = crumbs.map((crumb, i) => {
    const Icon = crumb.icon;
    const isLeaf = i === crumbs.length - 1;
    const iconOnly = compact && !isLeaf && Icon != null;
    const label = (
      <>
        {Icon ? (
          <Icon size={token.fontSize} aria-hidden style={{ flexShrink: 0, opacity: frame.crumbIconOpacity }} />
        ) : null}
        {iconOnly ? null : compact && isLeaf ? (
          <Typography.Text ellipsis={{ tooltip: crumb.label }} style={{ maxWidth: token.fontSize * frame.crumbMaxWidthEm, color: "inherit" }}>
            {crumb.label}
          </Typography.Text>
        ) : (
          <span>{crumb.label}</span>
        )}
      </>
    );
    return {
      title: crumb.to ? (
        renderLink({ to: crumb.to, style: rowStyle, ariaLabel: iconOnly ? crumb.label : undefined, children: label })
      ) : (
        <span style={rowStyle}>{label}</span>
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
            <Breadcrumb items={breadcrumbItems} />
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
