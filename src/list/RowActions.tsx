import { Button, Dropdown, theme } from "antd";
import type { MenuProps } from "antd";
import { ChevronRight, MoreVertical } from "lucide-react";
import { useRef, useState } from "react";
import type { HTMLAttributes, MouseEvent } from "react";
import { ACTIONS_COLUMN_PRIORITY } from "./columnKinds";

/** 行の操作の選択肢（「︙」のメニューと、行を押したときのメニューで同じものを使う） */
export type RowMenuItems = NonNullable<MenuProps["items"]>;

/**
 * 一覧の行の操作。雛形のデモのUsersの「Actions」列（Dropdown＋縦の三点のボタン）と同じ。
 * 列の定義は rowActionsColumn を使う。デモは右寄せだったが、表の列は見出しも値も
 * 左寄せにそろえるため、寄せ方の指定を持たない。
 */
export function RowActions({ items }: { items: RowMenuItems }) {
  const { token } = theme.useToken();
  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button type="text" aria-label="操作" icon={<MoreVertical size={token.fontSize} />} />
    </Dropdown>
  );
}

/** 操作の列から、行を押したときの選択肢を引くための表。DataTable が columns から探す */
const rowMenuOfColumn = new WeakMap<object, (record: never) => RowMenuItems>();

/**
 * 操作の列（並べ替えなし）。幅は、DataTable が使う側の values.list.actionsColumnWidth を入れる（withActionsColumnWidth）。itemsFor は、その行の「︙」の選択肢で、行を押したときの選択肢にも使う
 * （表ごとに二重に書かないため）。
 * スマホの幅（768px未満、antdの md より狭い）では列を隠し、行を押す操作だけにする（ACTIONS_COLUMN_PRIORITY）。
 */
export function rowActionsColumn<T>(itemsFor: (record: T) => RowMenuItems) {
  const column = {
    title: "操作",
    key: "actions",
    sorter: false,
    ...ACTIONS_COLUMN_PRIORITY,
    render: (_: unknown, record: T) => <RowActions items={itemsFor(record)} />,
  };
  rowMenuOfColumn.set(column, itemsFor as (record: never) => RowMenuItems);
  return column;
}

/** 1つの操作だけの列（rowOpenColumn）。幅を入れるために DataTable が見分ける */
const openColumns = new WeakSet<object>();

/** 1つの操作だけの列の「＞」のボタン。行を押したときの操作と二重に開かないよう、行へ伝えない */
function RowOpenButton({ label, onClick }: { label: string; onClick: () => void }) {
  const { token } = theme.useToken();
  return (
    <Button
      type="text"
      aria-label={label}
      icon={<ChevronRight size={token.fontSize} />}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    />
  );
}

/**
 * 行の操作が1つだけの表の操作の列。右端に「＞」を出し、押せることを示す。label は「＞」の読み上げの名前（操作の名前）。
 * 幅と隠す幅は rowActionsColumn と同じ（DataTable が values.list.actionsColumnWidth を入れる）。
 * 行を押したときも同じ操作にするには、使う側が DataTable の onRow に同じ onOpen を渡す。
 */
export function rowOpenColumn<T>(onOpen: (record: T) => void, label: string) {
  const column = {
    title: "操作",
    key: "actions",
    sorter: false,
    ...ACTIONS_COLUMN_PRIORITY,
    render: (_: unknown, record: T) => <RowOpenButton label={label} onClick={() => onOpen(record)} />,
  };
  openColumns.add(column);
  return column;
}

/** columns の中の rowActionsColumn・rowOpenColumn の列に、幅（values.list.actionsColumnWidth）を入れる。DataTable が使う */
export function withActionsColumnWidth<C extends object>(columns: readonly C[] | undefined, width: number): C[] | undefined {
  return columns?.map((c) => (rowMenuOfColumn.has(c) || openColumns.has(c) ? { ...c, width } : c));
}

/** columns の中の操作の列から、行を押したときの選択肢を引く関数を探す。操作の列がなければ undefined */
export function findRowMenu<T>(columns: readonly object[] | undefined): ((record: T) => RowMenuItems) | undefined {
  for (const c of columns ?? []) {
    const f = rowMenuOfColumn.get(c);
    if (f) return f as unknown as (record: T) => RowMenuItems;
  }
  return undefined;
}

/** 行の中のリンク・ボタン・入力欄・ほかのメニューを押したときは、行の選択肢を出さない */
const INTERACTIVE = "a, button, input, textarea, select, label, [role='button'], .ant-dropdown-trigger";

/**
 * 行を押すと、押した場所の近くにその行の操作の選択肢を出す行（antdの Table の components.body.row に使う）。
 * 位置は、antdの Dropdown の trigger に contextMenu を含めると、押した点に合わせる（alignPoint）ことを使う。
 * そのため、右クリックでも同じ選択肢が出る。
 */
export function MenuRow({
  rowMenu,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { rowMenu?: RowMenuItems }) {
  const [open, setOpen] = useState(false);
  const skip = useRef(false);
  if (!rowMenu) return <tr {...props} />;
  // 押した要素が、行の中のリンク・ボタンか、行の外（メニューのポップアップなど）なら出さない
  const decide = (e: MouseEvent<HTMLTableRowElement>) => {
    const row = e.currentTarget;
    const target = e.target as Element;
    // 行そのものも Dropdown の印（ant-dropdown-trigger）を持つため、行より内側の要素だけを見る
    const hit = target.closest(INTERACTIVE);
    skip.current = !row.contains(target) || (hit !== null && hit !== row && row.contains(hit));
  };
  return (
    <Dropdown
      menu={{ items: rowMenu }}
      trigger={["click", "contextMenu"]}
      open={open}
      onOpenChange={(next) => {
        if (next && skip.current) return;
        setOpen(next);
      }}
    >
      <tr
        {...props}
        onClickCapture={decide}
        onContextMenuCapture={decide}
        style={{ ...props.style, cursor: "pointer" }}
      />
    </Dropdown>
  );
}
