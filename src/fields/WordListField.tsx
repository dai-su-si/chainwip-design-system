// 原子の欄のうち、自由な語を打って Enter で札として並べる欄。値は文字列の配列。
import { Form, Select } from "antd";
import type { Store } from "antd/es/form/interface";
import { itemProps } from "./fieldBase";
import type { FieldBaseProps } from "./fieldBase";

/** 打った文を語に分ける区切りの既定（読点とカンマ） */
const DEFAULT_SEPARATORS: readonly string[] = ["、", ","];

export type WordListFieldProps<Values = Store> = FieldBaseProps<Values> & {
  /** 何も入れていないときの案内の文 */
  placeholder?: string;
  disabled?: boolean;
  /** 欄の名前（label）がないときの読み上げの名前 */
  ariaLabel?: string;
  /** 打った文を語に分ける区切り。既定は「、」と「,」 */
  separators?: readonly string[];
};

/** 語の並びの欄。自由な語を打ち、Enter か区切りで札として並べる。選択肢の窓は出さない */
export function WordListField<Values = Store>({
  placeholder,
  disabled,
  ariaLabel,
  separators = DEFAULT_SEPARATORS,
  ...base
}: WordListFieldProps<Values>) {
  return (
    <Form.Item<Values> {...itemProps(base)}>
      <Select<string[]>
        mode="tags"
        tokenSeparators={[...separators]}
        open={false}
        suffixIcon={null}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    </Form.Item>
  );
}
