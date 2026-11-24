// 見出しの文と中身を持つパネル（antdの Card）。題の区切り線を持たず、見出し・説明・中身を縦に並べる。
import { Card, Flex, Skeleton, Typography, theme } from "antd";
import type { LucideIcon } from "lucide-react";
import { Children, type CSSProperties, type ReactNode } from "react";
import { PanelNotice } from "./FormCard";

const { Text } = Typography;

export type HeadedCardProps = {
  title: string;
  /** 見出しの左に出すアイコン */
  icon?: LucideIcon;
  /** 読み込み中は、見出しを残し、中身の代わりに Skeleton を出す */
  loading?: boolean;
  /** 見出しの右に置く、このパネルの中身にだけ効く操作 */
  extra?: ReactNode;
  /** 見出しの下に出す、パネルの説明の文。なければ出さない */
  description?: ReactNode;
  /** 中身の先頭（欄の上）に出す知らせ（注意の色）。なければ出さない */
  notice?: ReactNode;
  style?: CSSProperties;
  children?: ReactNode;
};

export function HeadedCard({ title, icon: Icon, loading, extra, description, notice, style, children }: HeadedCardProps) {
  const { token } = theme.useToken();
  // 見出しの右の操作は、ボタンが文より高い分だけ上下へ出し、見出しの行を文の高さのままにする
  const extraOverhang = (token.fontSize * token.lineHeight - token.controlHeight) / 2;
  return (
    <Card style={style} data-headed-card="">
      {/* 見出し・説明・中身の間は token.margin（使う側の画面の検査が data-headed-card・data-panel-title で測る） */}
      <Flex vertical gap={token.margin}>
        <Flex align="center" justify="space-between" gap={token.marginSM}>
          <Flex align="center" gap={token.marginXS}>
            {Icon ? <Icon size={token.fontSizeLG} /> : null}
            <Text strong data-panel-title="">
              {title}
            </Text>
          </Flex>
          {extra ? <Flex style={{ marginBlock: extraOverhang }}>{extra}</Flex> : null}
        </Flex>
        {description ? <Text type="secondary">{description}</Text> : null}
        {/* 中身は1つにまとめ、中の並びは部品の余白だけにする（Form.Itemの間をantdの既定のままにする） */}
        {/* 知らせは中身の先頭に置き、欄と同じ Form.Item の余白で次の欄と区切る（FormCard と同じ） */}
        {loading ? (
          <Skeleton active />
        ) : notice || Children.toArray(children).length > 0 ? (
          <div data-headed-card-body="">
            {notice ? <PanelNotice notice={notice} /> : null}
            {children}
          </div>
        ) : null}
      </Flex>
    </Card>
  );
}
