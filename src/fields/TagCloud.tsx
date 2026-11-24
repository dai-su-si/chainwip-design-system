// タグクラウドの欄。決まった選択肢から、表示名で検索して複数を選ぶ（antdの Select の mode="multiple"）。
// 選択肢（値と表示名、まとまり）・案内の文・読み上げの名前は使う側が渡す。選んだタグの表示だけをするときは PillTagList を使う。
// Form.Item の中に置くと、value と onChange を Form が渡す。
import { Select } from "antd";
import { useMemo } from "react";

/** 選択肢。value は保存する値、label は画面に出す名前（検索もこの名前で行う） */
export type TagOption<V extends string = string> = { value: V; label: string };

/** 選択肢のまとまり。まとまりの名前を見出しにして、中の選択肢を並べる */
export type TagOptionGroup<V extends string = string> = { label: string; options: readonly TagOption<V>[] };

export type TagCloudProps<V extends string = string> = {
  /** 選べる選択肢（並べた順に出す）。まとまりに分けるときは TagOptionGroup を並べる */
  options: readonly (TagOption<V> | TagOptionGroup<V>)[];
  value?: V[];
  onChange?: (value: V[]) => void;
  /** Form.Item が渡す id（欄の名前と結び付ける） */
  id?: string;
  /** 何も選んでいないときの案内の文 */
  placeholder?: string;
  /** 欄の読み上げの名前 */
  ariaLabel?: string;
};

const isGroup = <V extends string>(o: TagOption<V> | TagOptionGroup<V>): o is TagOptionGroup<V> => "options" in o;

export function TagCloud<V extends string = string>({
  options,
  value = [],
  onChange,
  id,
  placeholder = "検索して選ぶ",
  ariaLabel,
}: TagCloudProps<V>) {
  // antd の Select は readonly の配列を受け取らないため、写してから渡す（選択肢が多いときのため、選択肢が変わったときだけ写す）
  const selectOptions = useMemo(
    () => options.map((o) => (isGroup(o) ? { label: o.label, options: [...o.options] } : o)),
    [options]
  );
  return (
    <Select<V[]>
      id={id}
      mode="multiple"
      showSearch={{ optionFilterProp: "label" }}
      placeholder={placeholder}
      aria-label={ariaLabel}
      options={selectOptions}
      value={value}
      onChange={(next) => onChange?.(next)}
    />
  );
}
