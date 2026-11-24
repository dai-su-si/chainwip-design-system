// 必須の欄の印。項目名の左の「*」をやめ、項目名の後ろに危険の色の印を出す。ThemeProvider が antd の form.requiredMark に渡す。
import type { ReactNode } from "react";
import { ConfigProvider, Flex, Typography, theme } from "antd";
import type { FormProps } from "antd";
import { useDesignValues } from "../theme/designValues";

function RequiredLabel({ label }: { label: ReactNode }) {
  const { token } = theme.useToken();
  const { text, gapToken, fontSizeToken } = useDesignValues().requiredMark;
  return (
    <Flex component="span" align="center" gap={token[gapToken]}>
      {label}
      {/* 印の文字の大きさは values.requiredMark.fontSizeToken の token にする */}
      <ConfigProvider theme={{ components: { Typography: { fontSize: token[fontSizeToken] } } }}>
        <Typography.Text type="danger">{text}</Typography.Text>
      </ConfigProvider>
    </Flex>
  );
}

/** antd の form.requiredMark に渡す関数。関数にすると antd は既定の「*」を出さない */
export const requiredMark: FormProps["requiredMark"] = (label, { required }) =>
  required ? <RequiredLabel label={label} /> : label;
