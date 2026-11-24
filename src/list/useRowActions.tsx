// 一覧の行の操作の選択肢のうち、どの画面でも同じ「編集」と「削除」。rowActionsColumn の itemsFor の中で使う。
import { theme } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import { useConfirmDanger } from "../feedback/dialogs";
import type { DeleteConfirm } from "../feedback/dialogs";
import type { RowMenuItems } from "./RowActions";

type RowMenuItem = RowMenuItems[number];

export function useRowActions() {
  const { token } = theme.useToken();
  const confirmDanger = useConfirmDanger();
  return {
    edit: (onClick: () => void): RowMenuItem => ({
      key: "edit",
      icon: <Pencil size={token.fontSize} />,
      label: "編集",
      onClick,
    }),
    /** 押すと確認を開き、確認の「削除」で onOk を呼ぶ */
    remove: (confirm: DeleteConfirm, onOk: () => void): RowMenuItem => ({
      key: "delete",
      icon: <Trash2 size={token.fontSize} />,
      label: "削除",
      danger: true,
      onClick: () => confirmDanger({ ...confirm, okText: "削除" }, onOk),
    }),
  };
}
