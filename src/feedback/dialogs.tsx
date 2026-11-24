// 取り消せない操作の確認と、続けられない理由・読むだけの文のダイアログ。
// アイコンは題の左に置き、文を左端から全幅で出す。ダイアログはすべてここから開く。
import { App, Flex, theme } from "antd";
import type { ModalFuncProps } from "antd";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { CircleAlert, Info } from "lucide-react";

/** 削除の確認の題と本文 */
export type DeleteConfirm = { title: string; content: string };

/** 取り消せない操作の確認。okText は呼ぶ側が文字で書く（使う側が名前の検査で照らせるようにするため） */
export type DangerConfirm = DeleteConfirm & Required<Pick<ModalFuncProps, "okText">>;

type DialogKind = "confirm" | "warning" | "info";

/** ダイアログの題。アイコンを題の左に置く */
function DialogTitle({ kind, title }: { kind: DialogKind; title: ReactNode }) {
  const { token } = theme.useToken();
  const Icon = kind === "info" ? Info : CircleAlert;
  return (
    <Flex align="center" gap={token.marginXS}>
      <Icon size={token.fontSizeLG} color={kind === "info" ? token.colorInfo : token.colorWarning} />
      {title}
    </Flex>
  );
}

/**
 * 確認・知らせのダイアログを開く関数。antdの左のアイコンの列をやめ、アイコンを題の左に置き、文を左端から全幅で出す。
 * antdの App の中で使う（App.useApp の modal を使うため）
 */
export function useDialog() {
  const { modal } = App.useApp();
  return useMemo(() => {
    const open = (kind: DialogKind) => (props: ModalFuncProps) =>
      modal[kind]({ ...props, icon: null, title: <DialogTitle kind={kind} title={props.title} /> });
    return { confirm: open("confirm"), warning: open("warning"), info: open("info") };
  }, [modal]);
}

/** 取り消せない操作の確認を開く関数。危険の色と「キャンセル」はここだけに書く */
export function useConfirmDanger() {
  const dialog = useDialog();
  return (confirm: DangerConfirm, onOk: () => void) => {
    dialog.confirm({ ...confirm, okType: "danger", cancelText: "キャンセル", onOk });
  };
}

/** 続けられない理由・読むだけの文のダイアログを開く関数。「閉じる」はここだけに書く */
export function useNotice() {
  const dialog = useDialog();
  return useMemo(() => {
    const open = (kind: "warning" | "info") => (title: ReactNode, content: ReactNode) => {
      dialog[kind]({ title, content, okText: "閉じる" });
    };
    return { warning: open("warning"), info: open("info") };
  }, [dialog]);
}
