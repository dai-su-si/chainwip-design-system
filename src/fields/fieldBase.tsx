// 原子の欄が共通に受け取る口と、欄の中の入力の部品（antd）を作る関数。
// 欄は antd の Form.Item を中に持ち、使う側は Form.Item・Row・Col・style={{ width: "100%" }} を書かない。
import { DatePicker, Input, InputNumber, TimePicker } from "antd";
import type { FormItemProps, FormRule, TimePickerProps } from "antd";
import type { NamePath, Store } from "antd/es/form/interface";
import type { Dayjs } from "dayjs";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { DesignValues } from "../theme/designValues";

/** どの欄も受け取る口。Values はフォームの値の型（渡すと name・dependencies を型で確かめる） */
export type FieldBaseProps<Values = Store> = {
  name: NamePath<Values>;
  /** 欄の名前 */
  label: ReactNode;
  /** 必須の印を出す（検査は rules に渡す） */
  required?: boolean;
  /** 保存を押したときの検査。誤りの文は欄の下に出る */
  rules?: FormRule[];
  /** 欄の下に出す説明の文 */
  extra?: ReactNode;
  /** この欄の検査を、ほかの欄が変わったときにもやり直す */
  dependencies?: NamePath<Values>[];
  /** 最初の誤りで検査を止める */
  validateFirst?: boolean;
};

/** 欄の共通の口を、antd の Form.Item の props にする */
export function itemProps<Values>(p: FieldBaseProps<Values>): FormItemProps<Values> {
  return {
    name: p.name,
    label: p.label,
    required: p.required,
    rules: p.rules,
    extra: p.extra,
    dependencies: p.dependencies,
    validateFirst: p.validateFirst,
  };
}

/** 入力の部品の種類。組（RangeField・RangeListField）はこのどれかを2つ並べる */
export type ControlKind = "text" | "number" | "date" | "month" | "time";

/** 日付・月・時刻に共通の口 */
export type PickerOptions = {
  /** false で、欄を空にする「×」を出さない（空にできない値のポカヨケ）。既定は antd のまま（出す） */
  allowClear?: boolean;
  /** 値が変わったときに呼ぶ（例: 月を変えたら、その月の日の選択を空にする）。フォームへの値の反映は欄が行う */
  onChange?: (value: Dayjs | null) => void;
};

/** 種類ごとの口（選べない範囲など） */
export type ControlOptions = {
  text: {
    /** 文字数の上限。超えて入れられない（ポカヨケ） */
    maxLength?: number;
    /** 文字数を欄の右下に出す。既定は出さない */
    showCount?: boolean;
  };
  /** 範囲の外を入れられないようにする（ポカヨケ） */
  number: { min?: number; max?: number };
  /** 選べない日（true を返した日を選べなくする） */
  date: { disabledDate?: (day: Dayjs) => boolean } & PickerOptions;
  /** 選べない月（true を返した月を選べなくする） */
  month: { disabledDate?: (month: Dayjs) => boolean } & PickerOptions;
  /** 選べない時・分 */
  time: { disabledTime?: TimePickerProps["disabledTime"] } & PickerOptions;
};

/** 種類と、その種類の選べない範囲の組 */
export type ControlSpec = { [K in ControlKind]: { kind: K } & ControlOptions[K] }[ControlKind];

/** どの種類の入力の部品にも渡せる口 */
export type ControlCommon = {
  placeholder?: string;
  disabled?: boolean;
  /** 欄の名前（label）がないときの読み上げの名前 */
  ariaLabel?: string;
};

const FULL_WIDTH: CSSProperties = { width: "100%" };

/**
 * 入力の部品（antd）の要素を作る。Form.Item が value・onChange・id をこの要素へ直接渡すため、部品で包まずに要素のまま返す。
 * 時刻は1分刻みで、「現在時刻」と「確定」を出さない
 */
export function controlElement(
  spec: ControlSpec,
  common: ControlCommon,
  values: DesignValues["field"],
): ReactElement {
  const { placeholder, disabled, ariaLabel } = common;
  const shared = { placeholder, disabled, "aria-label": ariaLabel };
  switch (spec.kind) {
    case "text":
      return <Input {...shared} maxLength={spec.maxLength} showCount={spec.showCount} />;
    case "number":
      return <InputNumber {...shared} min={spec.min} max={spec.max} style={FULL_WIDTH} />;
    case "date":
      return (
        <DatePicker
          {...shared}
          format={values.formats.date}
          disabledDate={spec.disabledDate}
          allowClear={spec.allowClear}
          onChange={spec.onChange}
          style={FULL_WIDTH}
        />
      );
    case "month":
      return (
        <DatePicker
          {...shared}
          picker="month"
          format={values.formats.month}
          disabledDate={spec.disabledDate}
          allowClear={spec.allowClear}
          onChange={spec.onChange}
          style={FULL_WIDTH}
        />
      );
    case "time":
      return (
        <TimePicker
          {...shared}
          format={values.formats.time}
          showNow={false}
          needConfirm={false}
          disabledTime={spec.disabledTime}
          allowClear={spec.allowClear}
          onChange={spec.onChange}
          style={FULL_WIDTH}
        />
      );
  }
}
