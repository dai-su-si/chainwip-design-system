// 子リスト原則の「普通の画面」の枠。ほかの概念のリスト（子のリスト）を持つ概念の追加・編集に使う。
// 左の広い列（xl16）に、パネル（HeadedCard）を上から並べ、最後に保存とキャンセルを置く。
// 中身の欄と子のリストは使う側が渡す。
// ダイアログの枠は BaseFormModal（FormModal.tsx）。
import { Button, Card, Col, Flex, Row, theme } from "antd";
import type { ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";

export type EditPageProps = {
  /** 上から並べるパネル（HeadedCard） */
  children: ReactNode;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  /** 編集する値の読み込み中は、パネルと保存の代わりに、読み込み中の Card を1つだけ出す */
  loading?: boolean;
};

export function EditPage({ children, saving, onSave, onCancel, loading }: EditPageProps) {
  const { token } = theme.useToken();
  const { pageGutter } = useDesignValues().edit;
  if (loading) return <Card loading />;
  return (
    <Row gutter={[pageGutter, pageGutter]}>
      <Col xs={24} xl={16}>
        <Flex vertical gap={token.margin}>
          {children}
          {/* 保存は1つで、パネルの値をまとめて保存する。押したときだけ行う（送信のボタンにしない）。
              送信のボタンにすると、年月の欄でEnterを押して値を決めたときに、途中のまま保存されたため */}
          <Flex gap={token.marginSM}>
            <Button type="primary" loading={saving} onClick={onSave}>
              保存
            </Button>
            <Button onClick={onCancel}>キャンセル</Button>
          </Flex>
        </Flex>
      </Col>
    </Row>
  );
}
