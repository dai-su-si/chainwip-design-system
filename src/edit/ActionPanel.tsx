// 操作を並べるパネル。見出しの下に「説明、ボタン」の組を上から並べる。
import { Button, Flex, Typography } from "antd";
import { HeadedCard } from "./HeadedCard";
import { useDesignValues } from "../theme/designValues";

const { Text } = Typography;

export type ActionItem = {
  key: string;
  /** ボタンの上の説明。なければ出さない */
  description?: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export type ActionPanelProps = { title: string; items: ActionItem[]; loading?: boolean };

export function ActionPanel({ title, items, loading }: ActionPanelProps) {
  const { betweenActions, relatedContent } = useDesignValues().panel;
  return (
    <HeadedCard title={title} loading={loading}>
      <Flex vertical gap={betweenActions}>
        {items.map((item) => (
          <Flex key={item.key} data-panel-action-item="" vertical align="start" gap={relatedContent}>
            {item.description ? <Text type="secondary">{item.description}</Text> : null}
            <Button onClick={item.onClick} disabled={item.disabled}>{item.label}</Button>
          </Flex>
        ))}
      </Flex>
    </HeadedCard>
  );
}
