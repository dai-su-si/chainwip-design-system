// 原子の欄のうち、開始と終了の組（RangeField）と、組のリスト（RangeListField）。
import { Button, Checkbox, Flex, Form, theme } from "antd";
import type { FormRule } from "antd";
import type { NamePath, Store } from "antd/es/form/interface";
import type { ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";
import { controlElement, itemProps } from "./fieldBase";
import type { ControlCommon, ControlKind, ControlOptions, ControlSpec, FieldBaseProps } from "./fieldBase";

/** 組の1つの欄（開始か終了）。欄の名前・検査・選べない範囲を、開始と終了でそれぞれ渡す */
export type RangeSide<Values = Store, K extends ControlKind = ControlKind> = FieldBaseProps<Values> &
  Omit<ControlCommon, "ariaLabel"> &
  ControlOptions[K];

/** 組の3つ目の場所に置く、組に付くチェック（例: 「参画中」） */
export type RangeCheck<Values = Store> = {
  name: NamePath<Values>;
  /** チェックの右の文 */
  text: ReactNode;
  rules?: FormRule[];
  /** 付けたとき、終了の欄を直せなくする（例: 参画中なら終了の月はない） */
  disablesEnd?: boolean;
};

export type RangeFieldProps<Values = Store> = {
  [K in ControlKind]: {
    /** 2つの欄の種類。時刻・月・数値の開始と終了のほか、姓・名のように2つの1行の文を横に並べるときは text */
    kind: K;
    start: RangeSide<Values, K>;
    end: RangeSide<Values, K>;
    /** 3つ目の場所に置くチェック */
    check?: RangeCheck<Values>;
    /**
     * 組全体の説明の文。組の下に、全幅で出す（開始・終了それぞれの欄の下の説明は start・end の extra）。
     * 例: 精算下限・上限の組の下の「月の稼働時間がこの幅を外れる見込みになると、…」
     */
    groupExtra?: ReactNode;
  };
}[ControlKind];

/** 開始か終了の欄の、入力の部品の種類と選べない範囲 */
function sideSpec<Values>(p: RangeFieldProps<Values>, which: "start" | "end"): ControlSpec {
  switch (p.kind) {
    case "number":
      return { kind: p.kind, min: p[which].min, max: p[which].max };
    case "date":
    case "month": {
      const s = p[which];
      return { kind: p.kind, disabledDate: s.disabledDate, allowClear: s.allowClear, onChange: s.onChange };
    }
    case "time": {
      const s = p[which];
      return { kind: p.kind, disabledTime: s.disabledTime, allowClear: s.allowClear, onChange: s.onChange };
    }
    case "text":
      return { kind: p.kind, maxLength: p[which].maxLength, showCount: p[which].showCount };
  }
}

/** 組のリストの1行の、開始か終了の欄の、入力の部品の種類と選べない範囲 */
function listSideSpec<Values>(p: RangeListFieldProps<Values>, which: "start" | "end", row: number): ControlSpec {
  switch (p.kind) {
    case "number":
      return { kind: p.kind, ...p[which].control?.(row) };
    case "date":
    case "month":
      return { kind: p.kind, ...p[which].control?.(row) };
    case "time":
      return { kind: p.kind, ...p[which].control?.(row) };
    case "text":
      return { kind: p.kind, ...p[which].control?.(row) };
  }
}

/** 組全体の説明の文を出すとき、組の中の欄の下の余白をなくし、説明の文を入力の部品のすぐ下に出す（1つの欄の extra と同じ間） */
const NO_MARGIN = { marginBottom: 0 } as const;

/** 開始・終了・操作は同じ幅で並べ、幅の下限を保てなければ順に折り返す */
function RangeRowLayout({
  kind,
  start,
  end,
  action,
  hasItemGap = false,
  alignActionAtEnd = false,
}: {
  kind: ControlKind;
  start: ReactNode;
  end: ReactNode;
  action?: ReactNode;
  hasItemGap?: boolean;
  alignActionAtEnd?: boolean;
}) {
  const { token } = theme.useToken();
  const { pairGapToken, pairMinWidth } = useDesignValues().field;
  const gap = token[pairGapToken];
  const minWidth = kind === "date" ? pairMinWidth.date : pairMinWidth.default;
  const width = `max(min(100%, ${minWidth}px), calc((100% - ${gap * 2}px) / 3))`;
  const column = { flex: `0 0 ${width}`, minWidth: 0 };
  return (
    <Flex wrap data-range-row style={{ columnGap: gap, rowGap: hasItemGap ? 0 : gap }}>
      <div style={column}>{start}</div>
      <div style={column}>{end}</div>
      {action && <div style={{ ...column, alignSelf: alignActionAtEnd ? "end" : undefined }}>{action}</div>}
    </Flex>
  );
}

/**
 * 開始と終了の組の欄。開始・終了・チェックの順で、幅に収まる範囲で横に並べる。
 * 終了で開始より前を選べなくするときは、end の disabledTime・disabledDate・min に渡す（ポカヨケ）
 */
export function RangeField<Values = Store>(props: RangeFieldProps<Values>) {
  const values = useDesignValues().field;
  const { check, groupExtra } = props;
  const hasGroupExtra = groupExtra !== undefined && groupExtra !== null;
  const innerStyle = hasGroupExtra ? NO_MARGIN : undefined;
  const side = (which: "start" | "end", disabled: boolean) => (
    <Form.Item<Values> {...itemProps(props[which])} style={innerStyle}>
      {controlElement(
        sideSpec(props, which),
        { placeholder: props[which].placeholder, disabled: props[which].disabled || disabled },
        values,
      )}
    </Form.Item>
  );
  const row = (endDisabled: boolean) => (
    <RangeRowLayout
      kind={props.kind}
      start={side("start", false)}
      end={side("end", endDisabled)}
      hasItemGap={!hasGroupExtra}
      alignActionAtEnd
      action={check && (
        <Form.Item<Values>
          name={check.name}
          valuePropName="checked"
          rules={check.rules}
          style={innerStyle}
        >
          <Checkbox>{check.text}</Checkbox>
        </Form.Item>
      )}
    />
  );
  // 組全体の説明の文は、組を包む名前のない Form.Item の extra に出す（欄の下の説明と同じ色・大きさ・間）
  const withGroupExtra = (endDisabled: boolean) =>
    hasGroupExtra ? <Form.Item extra={groupExtra}>{row(endDisabled)}</Form.Item> : row(endDisabled);
  if (!check?.disablesEnd) return withGroupExtra(false);
  // チェックの値が変わったら、終了の欄を直せる・直せないを切り替える
  return (
    <Form.Item<Values> noStyle dependencies={[check.name]}>
      {({ getFieldValue }) => withGroupExtra(Boolean(getFieldValue(check.name)))}
    </Form.Item>
  );
}

/** 組のリストの1行の、開始か終了の欄。行の番号（Form.List の name）ごとに、検査・検査をやり直す欄・選べない範囲を返す */
export type RangeListSide<K extends ControlKind = ControlKind> = {
  /** 欄の中の案内の文（例: 「開始」） */
  placeholder?: string;
  /** 読み上げの名前（例: 「休憩の開始」）。行の欄には名前を出さないため渡す */
  ariaLabel?: string;
  rules?: (row: number) => FormRule[];
  /** この欄の検査をやり直す欄（フォームの中の絶対の名前）。rows はいまの行の番号の並び */
  dependencies?: (row: number, rows: number[]) => NamePath[];
  /** 行ごとの選べない範囲（例: 終了で、その行の開始より前を選べなくする） */
  control?: (row: number) => ControlOptions[K];
};

/** 組のリストの1行の値。行の値は start と end の2つ */
export type RangeRow<T> = { start: T | null; end: T | null };

export type RangeListFieldProps<Values = Store> = {
  [K in ControlKind]: {
    kind: K;
    /** リストの名前。値は RangeRow の配列（antd の Form.List が受け取る形に限る） */
    name: NamePath<Values> & (string | number | (string | number)[]);
    /** 欄の名前 */
    label: ReactNode;
    /** 欄の下に出す説明の文 */
    extra?: ReactNode;
    start: RangeListSide<K>;
    end: RangeListSide<K>;
  };
}[ControlKind];

/**
 * 開始と終了の組のリストの欄（Form.List）。各行は RangeField と同じ並びで、終了の後に「削除」、下に「追加」を置く。0行も持てる。
 * 行の誤りの文は行の下に出し、文の幅で「削除」の位置を動かさない（行の欄は noStyle にし、誤りは行の Form.Item に出す）
 */
export function RangeListField<Values = Store>(props: RangeListFieldProps<Values>) {
  const values = useDesignValues().field;
  const { name, label, extra } = props;
  return (
    <Form.Item label={label} extra={extra}>
      <Form.List name={name}>
        {(rows, { add, remove }) => {
          const rowNames = rows.map((r) => r.name);
          const cell = (row: number, key: "start" | "end") => {
            const s = props[key];
            return (
              <Form.Item
                noStyle
                name={[row, key]}
                rules={s.rules?.(row)}
                dependencies={s.dependencies?.(row, rowNames)}
              >
                {controlElement(
                  listSideSpec(props, key, row),
                  { placeholder: s.placeholder, ariaLabel: s.ariaLabel },
                  values,
                )}
              </Form.Item>
            );
          };
          return (
            <>
              {rows.map((r) => (
                <Form.Item key={r.key}>
                  <RangeRowLayout
                    kind={props.kind}
                    start={cell(r.name, "start")}
                    end={cell(r.name, "end")}
                    action={<Button onClick={() => remove(r.name)}>削除</Button>}
                  />
                </Form.Item>
              ))}
              <Flex>
                <Button onClick={() => add({ start: null, end: null })}>追加</Button>
              </Flex>
            </>
          );
        }}
      </Form.List>
    </Form.Item>
  );
}
