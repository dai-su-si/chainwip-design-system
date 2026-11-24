// 追加・編集のダイアログ（BaseFormModal）の開閉、編集中の行、フォームの片付け。
import type { FormInstance } from "antd";
import { useCallback, useState } from "react";

type FieldValues<V> = Parameters<FormInstance<V>["setFieldsValue"]>[0];

export type FormDialog<E, V> = {
  open: boolean;
  /** 編集中の行。追加のときは null */
  editing: E | null;
  /** 追加で開く。欄を空に戻してから values を入れる */
  openCreate: (values?: FieldValues<V>) => void;
  /** 編集で開く。欄を空に戻してから values を入れる */
  openEdit: (row: E, values?: FieldValues<V>) => void;
  /** 閉じて、編集中の行をなくし、欄を空に戻す */
  close: () => void;
};

/** E は編集する行の型（追加だけのダイアログは never）、V はフォームの値の型 */
export function useFormDialog<E = never, V = unknown>(form: FormInstance<V>): FormDialog<E, V> {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<E | null>(null);

  const show = useCallback(
    (row: E | null, values?: FieldValues<V>) => {
      form.resetFields();
      if (values) form.setFieldsValue(values);
      setEditing(row);
      setOpen(true);
    },
    [form],
  );
  const openCreate = useCallback((values?: FieldValues<V>) => show(null, values), [show]);
  const openEdit = useCallback((row: E, values?: FieldValues<V>) => show(row, values), [show]);
  const close = useCallback(() => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  }, [form]);

  return { open, editing, openCreate, openEdit, close };
}
