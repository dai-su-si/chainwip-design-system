// 原子の欄のうち、決まった選択肢から選ぶ欄。1つを選ぶ・複数を選ぶ（Select）と、
// 少数の選択肢から複数を選ぶチェックの並び（Checkbox.Group）を、同じ欄の出し方の違いとして持つ。
import { Checkbox, Col, Form, Row, Select } from "antd";
import type { Store } from "antd/es/form/interface";
import { itemProps } from "./fieldBase";
import type { FieldBaseProps } from "./fieldBase";

/** 選択肢。value は保存する値、label は画面に出す名前（検索もこの名前で行う） */
export type SelectOption<V extends string | number = string> = { value: V; label: string };

/** antd の Grid の24の段を割り切れる列の数 */
export type CheckColumnCount = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 24;

/**
 * チェックの並びを格子に並べるときの、幅（antd の Grid の区切り）ごとの列の数。
 * 区切りの意味は antd の Col の xs・sm… と同じで、渡した区切りより広い幅は、その列の数を引き継ぐ
 */
export type CheckColumns = Partial<Record<"xs" | "sm" | "md" | "lg" | "xl" | "xxl", CheckColumnCount>>;

/** antd の Grid の段の数 */
const GRID_SPANS = 24;

/** 列の数を、antd の Col の幅（段の数）にする */
function colSpans(columns: CheckColumns) {
  return Object.fromEntries(Object.entries(columns).map(([bp, n]) => [bp, GRID_SPANS / n]));
}

export type SelectFieldProps<Values = Store, V extends string | number = string> = FieldBaseProps<Values> & {
  options: readonly SelectOption<V>[];
  placeholder?: string;
  disabled?: boolean;
  /** 選択肢の読み込み中（選択肢の右に回る印を出す） */
  loading?: boolean;
  /** 表示名で検索できるようにする */
  search?: boolean;
} & (
    | {
        /** 1つを選ぶ（既定） */
        multiple?: false;
      }
    | {
        /** 複数を選ぶ。値は選んだ value の配列 */
        multiple: true;
        /** 出し方。dropdown は Select、checks は選択肢をチェックの並びで全部出す（少数の選択肢のとき） */
        appearance?: "dropdown" | "checks";
        /**
         * checks のとき、チェックを格子に並べる、幅ごとの列の数（例: { xs: 3, sm: 4 } は狭い幅で3列、それ以外で4列）。
         * なければ、チェックを横に詰めて並べる
         */
        columns?: CheckColumns;
      }
  );

/** 選択の欄（1つ・複数） */
export function SelectField<Values = Store, V extends string | number = string>(props: SelectFieldProps<Values, V>) {
  const { options, placeholder, disabled, loading, search } = props;
  // antd の部品は readonly の配列を受け取らないため、写してから渡す
  const list = [...options];
  const item = itemProps(props);
  if (props.multiple && props.appearance === "checks") {
    const { columns } = props;
    if (columns) {
      const spans = colSpans(columns);
      return (
        <Form.Item<Values> {...item}>
          <Checkbox.Group<V> disabled={disabled} style={{ width: "100%" }}>
            <Row>
              {list.map((o) => (
                <Col key={o.value} {...spans}>
                  <Checkbox value={o.value}>{o.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      );
    }
    return (
      <Form.Item<Values> {...item}>
        <Checkbox.Group<V> options={list} disabled={disabled} />
      </Form.Item>
    );
  }
  return (
    <Form.Item<Values> {...item}>
      <Select<V | V[]>
        mode={props.multiple ? "multiple" : undefined}
        options={list}
        placeholder={placeholder}
        disabled={disabled}
        loading={loading}
        showSearch={search ? { optionFilterProp: "label" } : undefined}
      />
    </Form.Item>
  );
}
