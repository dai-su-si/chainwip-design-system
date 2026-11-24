import { Flex, theme } from "antd";
import { BarChart3 } from "lucide-react";
import type { ReactElement } from "react";
import { useDesignValues } from "../theme/designValues";

/**
 * Table empty state: icon in soft tile + bold title + secondary description (dashboard-style).
 */
export function DataTableEmpty(): ReactElement {
  const { token } = theme.useToken();
  const { empty } = useDesignValues().list;

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      gap={token.marginMD}
      className="data-table-empty"
      style={{
        paddingBlock: token.paddingXL,
        paddingInline: token.paddingLG,
        maxWidth: empty.maxWidth,
        marginInline: "auto",
      }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: empty.iconBoxSize,
          height: empty.iconBoxSize,
          borderRadius: token.borderRadiusLG,
          background: token.colorFillTertiary,
          // 25%は暗い背景で読めないため、antdのメニューの見出しの既定と同じ段にする
          color: token.colorTextTertiary,
        }}
      >
        <BarChart3 size={empty.iconSize} strokeWidth={empty.iconStrokeWidth} aria-hidden />
      </Flex>
      <Flex vertical align="center" gap={token.marginXXS} style={{ textAlign: "center" }}>
        <span
          style={{
            fontSize: token.fontSizeLG,
            fontWeight: token.fontWeightStrong,
            color: token.colorText,
            lineHeight: token.lineHeightLG,
          }}
        >
          データがありません
        </span>
        <span
          style={{
            fontSize: token.fontSize,
            fontWeight: 400,
            color: token.colorTextSecondary,
            lineHeight: token.lineHeight,
          }}
        >
          まだ表示するものがありません
        </span>
      </Flex>
    </Flex>
  );
}
