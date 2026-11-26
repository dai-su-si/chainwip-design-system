// 操作を並べるパネル。見出しの下に「説明、ボタン」の組を上から並べる。
import { Button, Flex, Typography } from "antd";
import { HeadedCard } from "./HeadedCard";
import { useDesignValues } from "../theme/designValues";

const { Text } = Typography;

export type ActionItem = {
  /** パネル内で一意な項目のキー */
  key: string;
  /** ボタンの上の説明。なければ出さない */
  description?: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** この操作だけを処理中とし、繰り返しの実行を止める */
  loading?: boolean;
  /** 解除や削除など、取り消しの重い操作を示す */
  danger?: boolean;
};

export type ActionPanelProps = {
  title: string;
  items: ActionItem[];
  loading?: boolean;
  /** 主操作として強調する項目のキー。指定できるのは1つまで */
  primaryActionKey?: string;
};

export function ActionPanel({ title, items, loading, primaryActionKey }: ActionPanelProps) {
  const { betweenActions, relatedContent } = useDesignValues().panel;
  const primaryActionIndex = items.findIndex((item) => item.key === primaryActionKey);
  return (
    <HeadedCard title={title} loading={loading}>
      <Flex vertical gap={betweenActions}>
        {items.map((item, index) => (
          <Flex key={item.key} data-panel-action-item="" vertical align="start" gap={relatedContent}>
            {item.description ? <Text type="secondary">{item.description}</Text> : null}
            <Button
              type={index === primaryActionIndex ? "primary" : "default"}
              onClick={item.loading ? undefined : item.onClick}
              disabled={item.disabled}
              loading={item.loading}
              aria-label={item.label}
              aria-busy={item.loading || undefined}
              aria-disabled={item.loading || undefined}
              danger={item.danger}
            >
              {item.label}
            </Button>
          </Flex>
        ))}
      </Flex>
    </HeadedCard>
  );
}
