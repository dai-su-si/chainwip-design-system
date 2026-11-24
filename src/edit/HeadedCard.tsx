import { Card, Flex, Skeleton, theme } from "antd";
import { Children, type ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";

export type HeadedCardProps = {
  title: string;
  /** 読み込み中は、見出しを残し、中身の代わりに Skeleton を出す */
  loading?: boolean;
  /** パネル単位の「保存」など、見出しの右に置く操作 */
  extra?: ReactNode;
  children?: ReactNode;
};

/** 文字の見出しと本文を持つ、共通のパネル枠。 */
export function HeadedCard({ title, loading, extra, children }: HeadedCardProps) {
  const { token } = theme.useToken();
  const { headingToBody } = useDesignValues().panel;
  // 見出しの右の操作は、ボタンが文より高い分だけ上下へ出し、見出しの行を文の高さのままにする
  const extraOverhang = (token.fontSize * token.lineHeight - token.controlHeight) / 2;
  return (
    <Card data-headed-card="">
      <Flex vertical gap={headingToBody}>
        <Flex data-panel-heading="" align="center" justify="space-between" gap={token.marginSM}>
          <h2 data-panel-title="" style={{ margin: 0, fontSize: token.fontSize, fontWeight: token.fontWeightStrong, lineHeight: token.lineHeight }}>
            {title}
          </h2>
          {extra ? <Flex data-panel-actions="" style={{ marginBlock: extraOverhang }}>{extra}</Flex> : null}
        </Flex>
        {loading || Children.toArray(children).length > 0 ? (
          <div data-headed-card-body="">
            {loading ? <Skeleton active /> : children}
          </div>
        ) : null}
      </Flex>
    </Card>
  );
}
