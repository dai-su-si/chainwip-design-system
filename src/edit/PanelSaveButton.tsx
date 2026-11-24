import { Button, Form } from "antd";

/** 所属するフォームを、ボタンが操作されたときに保存する。 */
export function PanelSaveButton({ saving }: { saving?: boolean }) {
  const form = Form.useFormInstance();
  return (
    <Button type="primary" loading={saving} onClick={() => form.submit()}>
      保存
    </Button>
  );
}
