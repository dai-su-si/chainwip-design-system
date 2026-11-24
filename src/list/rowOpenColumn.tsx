import { Button, theme } from "antd";
import { ChevronRight } from "lucide-react";

const openColumns = new WeakSet<object>();

function RowOpenButton({ label, onClick }: { label: string; onClick: () => void }) {
  const { token } = theme.useToken();
  return (
    <Button
      type="text"
      aria-label={label}
      icon={<ChevronRight size={token.fontSize} />}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    />
  );
}

/** 子リストの行を開く列。全幅で名前付きの矢印ボタンを表示する。 */
export function rowOpenColumn<T>(onOpen: (record: T) => void, label: string | ((record: T) => string)) {
  const column = {
    key: "actions",
    sorter: false,
    render: (_: unknown, record: T) => (
      <RowOpenButton label={typeof label === "string" ? label : label(record)} onClick={() => onOpen(record)} />
    ),
  };
  openColumns.add(column);
  return column;
}

export function withOpenColumnWidth<C extends object>(columns: readonly C[] | undefined, width: number): C[] | undefined {
  return columns?.map((column) => openColumns.has(column) ? { ...column, width } : column);
}
