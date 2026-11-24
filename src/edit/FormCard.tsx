// 見出しのない入力のパネル（antd の Card）と、入力のパネルの先頭の知らせ。
// パネルが1つの画面では見出しを付けないため、HeadedCard の代わりに使う。
import { Alert, Card, Form } from "antd";
import type { CSSProperties, ReactNode } from "react";

/** パネルの先頭の知らせ（注意の色）。欄と同じ Form.Item の余白で、次の欄と区切る */
export function PanelNotice({ notice }: { notice: ReactNode }) {
  return (
    <Form.Item>
      <Alert type="warning" showIcon title={notice} />
    </Form.Item>
  );
}

export type FormCardProps = {
  /** 欄の上に出す知らせ（例: なぜこの画面が開いたか）。なければ出さない */
  notice?: ReactNode;
  style?: CSSProperties;
  /** 上から並べる原子の欄 */
  children?: ReactNode;
};

/** 見出しのない入力のパネル。パネルが1つの画面に使う */
export function FormCard({ notice, style, children }: FormCardProps) {
  return (
    <Card style={style}>
      {notice ? <PanelNotice notice={notice} /> : null}
      {children}
    </Card>
  );
}
