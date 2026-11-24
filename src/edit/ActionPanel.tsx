// 操作を並べるパネル。見出しの下に「説明、ボタン」の組を上から並べる。
import { Flex, Typography, theme } from "antd";
import type { ReactNode } from "react";
import { HeadedCard } from "./HeadedCard";

const { Text } = Typography;

export type ActionItem = {
  key: string;
  /** ボタンの上の説明。なければ出さない */
  description?: ReactNode;
  /** ボタン1つ。文字の幅にし、枠いっぱいに広げない */
  action: ReactNode;
};

export type ActionPanelProps = { title: string; items: ActionItem[]; loading?: boolean };

export function ActionPanel({ title, items, loading }: ActionPanelProps) {
  const { token } = theme.useToken();
  return (
    <HeadedCard title={title} loading={loading}>
      {/* 組と組の間は、見出しの下と同じ token.margin */}
      <Flex vertical gap={token.margin}>
        {items.map((item) => (
          <Flex key={item.key} vertical align="start" gap={token.marginXS}>
            {item.description ? <Text type="secondary">{item.description}</Text> : null}
            {item.action}
          </Flex>
        ))}
      </Flex>
    </HeadedCard>
  );
}
