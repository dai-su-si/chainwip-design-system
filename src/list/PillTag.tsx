import { Flex, Tag, theme } from "antd";
import type { TagProps } from "antd";
import type { ReactNode } from "react";
import { useDesignValues } from "../theme/designValues";

/**
 * 一覧の中の区分・状態の札。雛形のデモのUsersの「Roles」列の Tag と同じ見た目（枠線・角丸・背景なし）。
 * 色は区別に要るときだけ付ける（例: 「進行中」の状態だけに色を付ける）。角の丸みは使う側の values.list.pillRadius。
 * wrap を付けると、長い文字を列の幅で折り返す（既定は1行のまま）。
 */
export function PillTag({
  color,
  wrap = false,
  children,
}: {
  color?: TagProps["color"];
  wrap?: boolean;
  children: ReactNode;
}) {
  const { pillRadius } = useDesignValues().list;
  return (
    <Tag
      variant="outlined"
      color={color}
      styles={{
        root: {
          borderRadius: pillRadius,
          background: "transparent",
          boxShadow: "none",
          ...(wrap ? { whiteSpace: "normal", maxWidth: "100%" } : {}),
        },
      }}
    >
      {children}
    </Tag>
  );
}

/** PillTagList に渡す札1つ。key は並びの中で重ならない値（選択肢の value など） */
export type PillTagItem = { key: string; label: ReactNode };

/**
 * 札（PillTag）の並び。タグクラウドの欄（TagCloud）で選んだタグを、表のセルや詳細に表示だけするときに使う。
 */
export function PillTagList({ items }: { items: readonly PillTagItem[] }) {
  const { token } = theme.useToken();
  return (
    <Flex wrap gap={token.marginXXS}>
      {items.map((t) => (
        <PillTag key={t.key} wrap>
          {t.label}
        </PillTag>
      ))}
    </Flex>
  );
}
