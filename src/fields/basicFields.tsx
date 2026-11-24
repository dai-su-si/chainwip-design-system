// 原子の欄のうち、1つの値を持つ欄: 1行の文・複数行の文・はい・いいえ・日付・月・時刻・数値・表示だけ。
import { Checkbox, Form, Input, Typography, theme } from "antd";
import type { FormItemProps } from "antd";
import type { Store } from "antd/es/form/interface";
import type { ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";
import { controlElement, itemProps } from "./fieldBase";
import type { ControlCommon, ControlOptions, FieldBaseProps } from "./fieldBase";

export type TextFieldProps<Values = Store> = FieldBaseProps<Values> &
  Omit<ControlCommon, "ariaLabel"> &
  ControlOptions["text"];

/** 1行の文の欄（Input）。maxLength で文字数の上限、showCount で文字数の表示 */
export function TextField<Values = Store>({ placeholder, disabled, maxLength, showCount, ...base }: TextFieldProps<Values>) {
  const values = useDesignValues().field;
  return (
    <Form.Item<Values> {...itemProps(base)}>
      {controlElement({ kind: "text", maxLength, showCount }, { placeholder, disabled }, values)}
    </Form.Item>
  );
}

export type TextAreaFieldProps<Values = Store> = Omit<FieldBaseProps<Values>, "label"> &
  Omit<ControlCommon, "ariaLabel"> &
  ControlOptions["text"] & {
    /** 行数（最小と最大）。既定は values.field.textAreaRows */
    rows?: { minRows: number; maxRows: number };
    /**
     * 検査のきっかけ（antd の Form.Item の validateTrigger）。[] を渡すと、打つたびには検査せず、保存を押したときだけ検査する。
     * 既定は antd のまま（打つたびに検査する）
     */
    validateTrigger?: FormItemProps["validateTrigger"];
  } & (
    | {
        /** 欄の名前 */
        label: ReactNode;
        /** 読み上げの名前。既定は欄の名前 */
        ariaLabel?: string;
      }
    | {
        /** 欄の名前を出さない（パネルの見出しが名前の役をするとき） */
        label?: undefined;
        /** 読み上げの名前。欄の名前を出さないときは必ず渡す */
        ariaLabel: string;
      }
  );

/** 複数行の文の欄（Input.TextArea）。文の長さで、最小と最大の行数の間で伸び縮みする */
export function TextAreaField<Values = Store>({
  placeholder,
  disabled,
  rows,
  maxLength,
  showCount,
  ariaLabel,
  validateTrigger,
  label,
  ...base
}: TextAreaFieldProps<Values>) {
  const values = useDesignValues().field;
  const { token } = theme.useToken();
  // 文字数の表示は、欄の外の下でなく、欄の枠の中の右下に出す。文の最後の行と重ならないよう、欄の下に1行分の内側の余白を取る
  const lineHeightPx = token.fontSize * token.lineHeight;
  const countInside = showCount
    ? {
        textarea: { paddingBottom: lineHeightPx + token.paddingXXS },
        count: {
          bottom: token.paddingXXS,
          insetInlineEnd: token.controlPaddingHorizontal - token.lineWidth,
          lineHeight: `${lineHeightPx}px`,
        },
      }
    : undefined;
  return (
    <Form.Item<Values> {...itemProps({ ...base, label })} validateTrigger={validateTrigger}>
      <Input.TextArea
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        autoSize={rows ?? values.textAreaRows}
        maxLength={maxLength}
        showCount={showCount}
        styles={countInside}
      />
    </Form.Item>
  );
}

export type CheckFieldProps<Values = Store> = Omit<FieldBaseProps<Values>, "label"> & {
  /** 欄の名前。なければ、チェックの文だけを出す */
  label?: ReactNode;
  /** チェックの右の文（例: 「ほかの人に見せない」） */
  text: ReactNode;
  disabled?: boolean;
};

/** はい・いいえの欄（チェック1つ）。値は boolean */
export function CheckField<Values = Store>({ label, text, disabled, ...base }: CheckFieldProps<Values>) {
  return (
    <Form.Item<Values> {...itemProps({ ...base, label })} valuePropName="checked">
      <Checkbox disabled={disabled}>{text}</Checkbox>
    </Form.Item>
  );
}

export type DateFieldProps<Values = Store> = FieldBaseProps<Values> &
  Omit<ControlCommon, "ariaLabel"> &
  (
    | ({ picker?: "date" } & ControlOptions["date"])
    | ({ picker: "month" } & ControlOptions["month"])
    | ({ picker: "time" } & ControlOptions["time"])
  );

/**
 * 日付・月・時刻の欄（DatePicker・TimePicker）。値は dayjs。選べない日・月・時刻を渡せる。
 * allowClear={false} で空にさせない。onChange は値が変わったときに呼ぶ（フォームへの反映は欄が行う）
 */
export function DateField<Values = Store>(props: DateFieldProps<Values>) {
  const values = useDesignValues().field;
  const common = { placeholder: props.placeholder, disabled: props.disabled };
  const picker = { allowClear: props.allowClear, onChange: props.onChange };
  const control =
    props.picker === "time"
      ? controlElement({ kind: "time", disabledTime: props.disabledTime, ...picker }, common, values)
      : controlElement({ kind: props.picker ?? "date", disabledDate: props.disabledDate, ...picker }, common, values);
  return <Form.Item<Values> {...itemProps(props)}>{control}</Form.Item>;
}

export type NumberFieldProps<Values = Store> = FieldBaseProps<Values> &
  Omit<ControlCommon, "ariaLabel"> &
  ControlOptions["number"];

/** 数値の欄（InputNumber）。min・max の外を入れられない */
export function NumberField<Values = Store>({ placeholder, disabled, min, max, ...base }: NumberFieldProps<Values>) {
  const values = useDesignValues().field;
  return (
    <Form.Item<Values> {...itemProps(base)}>
      {controlElement({ kind: "number", min, max }, { placeholder, disabled }, values)}
    </Form.Item>
  );
}

export type DisplayFieldProps = {
  /** 欄の名前 */
  label: ReactNode;
  /** 出す値（直せない） */
  value: ReactNode;
  /** 欄の下に出す説明の文 */
  extra?: ReactNode;
  /** 値の中の改行をそのまま改行として出す（長い文を読むだけで出すとき）。既定は出さない（1行の値の見た目を変えない） */
  multiline?: boolean;
};

const MULTILINE_STYLE = { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } as const;

/**
 * 表示だけの欄。直せない値を、ほかの欄と同じ名前と間で出す。
 * layout="vertical" を欄に持たせ、フォーム（Form）の外でも、名前が上・値が下の同じ形で出す
 */
export function DisplayField({ label, value, extra, multiline }: DisplayFieldProps) {
  return (
    <Form.Item label={label} extra={extra} layout="vertical">
      <Typography.Text style={multiline ? MULTILINE_STYLE : undefined}>{value}</Typography.Text>
    </Form.Item>
  );
}
