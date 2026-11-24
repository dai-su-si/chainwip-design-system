// 一覧管理画面の右上の主の操作「追加」。アイコンは付けず、名前の文字だけにする。
import { Button } from "antd";

export type AddButtonProps = { onClick: () => void };

export function AddButton({ onClick }: AddButtonProps) {
  return (
    <Button type="primary" onClick={onClick}>
      追加
    </Button>
  );
}
