import { DatePicker, Select, theme } from "antd";
import dayjs from "dayjs";
import type { LucideIcon } from "lucide-react";
import { useDesignValues } from "../theme/designValues";
import type { FilterToolbarSlot } from "./FilterToolbar";

/**
 * 一覧の絞り込みの欄のうち、選択（selectSlot）と、対象月・年の2つ。いくつもの一覧で同じ形を写していたため、
 * 1つにした（keywordSlot と同じ考え方）。値は空の文字で「すべて」を表し、URLの検索の状態にそのまま入れる。
 * fixed は、親の画面の中の子のリストのように、絞り込みの値を変えられないときに使う（消せず、選べない）。
 * 業務の名前を持つ欄（例: ある概念を選ぶ欄）は、使う側が selectSlot にアイコンと選択肢を渡して作る。
 * 欄の幅は、使う側の values.list.filterControlWidth（FilterToolbar は minWidth のない欄をこの幅とみなす）
 */
export type SlotOptions = {
  value: string;
  onChange: (value: string) => void;
  fixed?: boolean;
};

export type SelectSlotOptions = SlotOptions & {
  placeholder: string;
  /** 欄の前に付けるアイコン */
  icon: LucideIcon;
  options: { label: string; value: string }[];
};

/** 選択の欄。アイコンの大きさに token を、幅に使う側の値を使うため、部品にした */
function FilterSelect({ value, onChange, fixed, placeholder, icon: Icon, options }: SelectSlotOptions) {
  const { token } = theme.useToken();
  const width = useDesignValues().list.filterControlWidth;
  return (
    <Select
      allowClear={!fixed}
      disabled={fixed}
      placeholder={placeholder}
      style={{ width }}
      prefix={<Icon size={token.fontSize} />}
      value={value || undefined}
      onChange={(v?: string) => onChange(v ?? "")}
      options={options}
    />
  );
}

/**
 * 選択の絞り込みの欄。いくつもの一覧の状態などの欄で同じ形を写していたため、1つにした。
 * 選択肢と案内の文は、各画面で渡す
 */
export function selectSlot({ key, ...opts }: SelectSlotOptions & { key: string }): FilterToolbarSlot {
  return { key, children: <FilterSelect {...opts} /> };
}

/** 対象月の欄。幅に使う側の値を使うため、部品にした */
function MonthPicker({ value, onChange, fixed }: SlotOptions) {
  const width = useDesignValues().list.filterControlWidth;
  return (
    <DatePicker
      picker="month"
      allowClear={!fixed}
      disabled={fixed}
      placeholder="対象月"
      format="YYYY年M月"
      style={{ width }}
      value={value ? dayjs(`${value}-01`) : null}
      onChange={(d) => onChange(d ? d.format("YYYY-MM") : "")}
    />
  );
}

/** 年の欄。幅に使う側の値を使うため、部品にした */
function YearPicker({ value, onChange }: SlotOptions) {
  const width = useDesignValues().list.filterControlWidth;
  return (
    <DatePicker
      picker="year"
      allowClear
      placeholder="年"
      format="YYYY年"
      style={{ width }}
      value={value ? dayjs(`${value}-01-01`) : null}
      onChange={(d) => onChange(d ? d.format("YYYY") : "")}
    />
  );
}

/** 対象月（YYYY-MM）。表示は「2026年10月」 */
export function monthSlot(opts: SlotOptions): FilterToolbarSlot {
  return { key: "month", children: <MonthPicker {...opts} /> };
}

/** 年（YYYY）。表示は「2026年」 */
export function yearSlot(opts: SlotOptions): FilterToolbarSlot {
  return { key: "year", children: <YearPicker {...opts} /> };
}
