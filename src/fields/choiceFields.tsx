// 原子の欄のうち、タグクラウド（TagCloud）と画像の選択（ImageChoiceCards）を、ほかの欄と同じ口の欄として包んだもの。
import { Button, Flex, Form } from "antd";
import type { Store } from "antd/es/form/interface";
import { ImageChoiceCards } from "./ImageChoiceCards";
import type { ImageChoice } from "./ImageChoiceCards";
import { TagCloud } from "./TagCloud";
import type { TagOption, TagOptionGroup } from "./TagCloud";
import { useDesignValues } from "../theme/designValues";
import { itemProps } from "./fieldBase";
import type { FieldAssist, FieldBaseProps } from "./fieldBase";

/**
 * 保存する値と、選んだ選択肢の value の配列の間の変換。保存する値が value の配列でないとき（例: 区分を持つタグの並び）に渡す。
 * fromSelected の previous は、選び直す前の保存する値（前からあるタグの区分を残すときに使う）
 */
export type TagCloudAdapter<V extends string, S> = {
  toSelected: (stored: S | undefined) => V[];
  fromSelected: (selected: V[], previous: S | undefined) => S;
};

export type TagCloudFieldProps<Values = Store, V extends string = string, S = V[]> = FieldBaseProps<Values> & {
  options: readonly (TagOption<V> | TagOptionGroup<V>)[];
  /** 何も選んでいないときの案内の文 */
  placeholder?: string;
  /** 欄の読み上げの名前 */
  ariaLabel?: string;
  /** 保存する値が value の配列でないときの変換。なければ value の配列のまま保存する */
  adapter?: TagCloudAdapter<V, S>;
  /** 欄の横（右）に置く補助の操作。押しても保存しない */
  assist?: FieldAssist;
};

/** タグクラウドの欄。決まった選択肢から、表示名で検索して複数を選ぶ */
export function TagCloudField<Values = Store, V extends string = string, S = V[]>({
  options,
  placeholder,
  ariaLabel,
  adapter,
  assist,
  ...base
}: TagCloudFieldProps<Values, V, S>) {
  const { relatedContent } = useDesignValues().panel;
  const valueProps = {
    getValueProps: adapter ? (stored: S | undefined) => ({ value: adapter.toSelected(stored) }) : undefined,
    normalize: adapter ? (selected: V[], previous: S | undefined) => adapter.fromSelected(selected, previous) : undefined,
  };
  const control = <TagCloud<V> options={options} placeholder={placeholder} ariaLabel={ariaLabel} />;
  if (!assist)
    return (
      <Form.Item<Values> {...itemProps(base)} {...valueProps}>
        {control}
      </Form.Item>
    );
  // 欄の名前・必須の印・説明の文は外の Form.Item が出し、値と検査は内の Form.Item（noStyle）が持つ。誤りの文は外の欄の下に出る
  const { name, rules, dependencies, validateFirst, ...outer } = itemProps(base);
  return (
    <Form.Item<Values> {...outer}>
      <Flex gap={relatedContent} align="start" data-field-assist="">
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <Form.Item<Values>
            name={name}
            rules={rules}
            dependencies={dependencies}
            validateFirst={validateFirst}
            noStyle
            {...valueProps}
          >
            {control}
          </Form.Item>
        </div>
        <Button onClick={assist.onClick} loading={assist.loading}>
          {assist.label}
        </Button>
      </Flex>
    </Form.Item>
  );
}

export type ImageChoiceFieldProps<Values = Store, V extends string = string> = FieldBaseProps<Values> & {
  options: readonly ImageChoice<V>[];
  /** 説明の最大の行数。既定は values.imageChoiceCards.descriptionRows */
  descriptionRows?: number;
};

/** 画像の選択の欄。画像付きのカードから1つを選ぶ */
export function ImageChoiceField<Values = Store, V extends string = string>({
  options,
  descriptionRows,
  ...base
}: ImageChoiceFieldProps<Values, V>) {
  return (
    <Form.Item<Values> {...itemProps(base)}>
      <ImageChoiceCards<V> options={options} descriptionRows={descriptionRows} />
    </Form.Item>
  );
}
