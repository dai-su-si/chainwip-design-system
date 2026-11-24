// パネルの中の、押せる行のリスト。1行で「…」に省き、右に「＞」、行の間に区切り線、乗ると背景が濃くなる。
// 行の文と、空のときの文は使う側が渡す。
import { ConfigProvider, Menu, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import { ChevronRight } from "lucide-react";

export type LinkListItem = { key: string; text: string; onClick: () => void };

export type LinkListProps = {
  items: LinkListItem[];
  /** items が空のときの文 */
  empty: string;
};

/** items が空のときは empty の文を、行の文字と同じ左の余白で出す */
export function LinkList({ items, empty }: LinkListProps) {
  const { token } = theme.useToken();
  if (items.length === 0)
    return (
      // 行の左の余白（inlineIndent）と同じだけ空け、文の左端を行の文字にそろえる
      <Typography.Text type="secondary" style={{ display: "block", paddingInlineStart: token.paddingXS }}>
        {empty}
      </Typography.Text>
    );
  const menuItems: MenuProps["items"] = items.flatMap((item, i) => [
    ...(i > 0 ? [{ type: "divider" as const, key: `divider-${item.key}` }] : []),
    {
      key: item.key,
      label: item.text,
      title: item.text,
      extra: <ChevronRight size={token.fontSize} aria-hidden />,
      onClick: item.onClick,
    },
  ]);
  const itemHeight = token.controlHeightLG;
  // 行の文字の上と下の余白の分だけ上下へ出し、最初の行の文字を見出しの下16pxにそろえる（HeadedCard の見出しの下の余白）
  const rowOverhang = (token.fontSize * token.lineHeight - itemHeight) / 2;
  return (
    // メニューの右の線と左右の余白を消し、パネルの文字の左端にそろえる
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            activeBarBorderWidth: 0,
            itemMarginInline: 0,
            itemMarginBlock: 0,
            itemHeight,
          },
        },
      }}
    >
      <Menu
        mode="inline"
        selectable={false}
        inlineIndent={token.paddingXS}
        items={menuItems}
        style={{ marginBlock: rowOverhang }}
      />
    </ConfigProvider>
  );
}
