// サイドバーの下の利用者の欄。押すと、利用者の基本情報の画面へ移る。移る処理（onOpen）と欄の名前（label）は使う側が渡す。
// 丸いアイコンとドロップダウンのメニューを消し、ログアウトは基本情報の画面の「アカウント操作」へ移した
// クリック可能であることを示すために、ボタンの存在は必要です。」）。ボタンの押下は欄の onClick へ伝わり、メニューは出さない。
// 畳んだとき（細い幅）は名前とメールが入らないため、メニューの項目と同じ人のアイコン（lucideのUser）だけを出す（AIの判断）
import { Button, Flex, Tooltip, Typography, theme } from "antd";
import { MoreVertical, User as UserIcon } from "lucide-react";
import { useDesignValues } from "../theme/designValues";
import "./UserMenu.css";

const { Text } = Typography;

/** 欄に出す利用者。名前とメール */
export type UserMenuUser = { username: string; email: string | null };

export interface UserMenuProps {
  collapsed: boolean;
  user: UserMenuUser | null;
  /** 欄の名前（読み上げと、畳んだときのツールチップ）。例: 「基本情報」 */
  label: string;
  selected: boolean;
  onOpen: () => void;
}

export function UserMenu({ collapsed, user, label, selected, onOpen }: UserMenuProps) {
  const { token } = theme.useToken();
  const { frame } = useDesignValues();

  const trigger = (
    <Flex
      className="user-menu-trigger"
      role="link"
      tabIndex={0}
      aria-label={label}
      aria-current={selected ? "page" : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      align="center"
      justify={collapsed ? "center" : "flex-start"}
      gap={token.marginSM}
      style={{
        width: "100%",
        cursor: "pointer",
        borderRadius: token.borderRadius,
        padding: token.paddingXS,
        background: selected ? token.colorFillSecondary : undefined,
        ["--user-menu-hover-bg" as string]: token.colorFillTertiary,
      }}
    >
      {collapsed ? (
        <UserIcon size={token.size} />
      ) : (
        <>
        <Flex
          vertical
          justify="center"
          gap={frame.userMenuLineGap}
          style={{ flex: "1 1 0%", minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
        >
          <Text ellipsis style={{ lineHeight: 1, display: "block", maxWidth: "100%" }}>
            {user?.username ?? "—"}
          </Text>
          <Text
            ellipsis
            style={{
              lineHeight: 1,
              display: "block",
              maxWidth: "100%",
              fontSize: token.fontSizeSM,
              // 25%は暗い背景で読めないため、antdのメニューの見出しの既定と同じ段にする
              color: token.colorTextTertiary,
            }}
          >
            {user?.email ?? "—"}
          </Text>
        </Flex>
        <Button
          type="text"
          size="small"
          tabIndex={-1}
          aria-hidden
          icon={<MoreVertical size={token.fontSize} />}
        />
        </>
      )}
    </Flex>
  );

  // 上の区切り線はサイドバーと同じ境界線のトークンを使う。
  return (
    <div
      style={{
        borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        padding: token.paddingXS,
      }}
    >
      {collapsed ? (
        <Tooltip title={label} placement="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
    </div>
  );
}
