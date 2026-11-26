import { Button, Form } from "antd";
import { useContext } from "react";
import { PanelSaveButtonTypeContext } from "../theme/designValues";

/** 所属するフォームを、ボタンが操作されたときに保存する。 */
export function PanelSaveButton({ saving }: { saving?: boolean }) {
  const form = Form.useFormInstance();
  const type = useContext(PanelSaveButtonTypeContext) ?? "primary";
  return (
    <Button type={type} loading={saving} onClick={() => form.submit()}>
      保存
    </Button>
  );
}
