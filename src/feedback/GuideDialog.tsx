// 利用者を案内する汎用のダイアログ。題・前置きの文（任意）・画像（任意）・①②の番号つきの手順・主のボタン・「閉じる」を出す。
import { Card, Flex, Image, Typography, theme } from "antd";
import type { ModalFuncProps } from "antd";
import { useMemo } from "react";
import { useDesignValues } from "../theme/designValues";
import { useDialog } from "./dialogs";

/** 案内の中身。題と主のボタンの名前（okText）は呼ぶ側が文字で書く（使う側が名前の検査で照らせるようにするため） */
export type Guide = Required<Pick<ModalFuncProps, "title" | "okText">> & {
  /** 画像の前に出す1文。手順の前にすること（主のボタンを押すと何が開くかなど）を書く */
  lead?: string;
  /** 案内の画像。幅いっぱいに縮めて出す */
  image?: { src: string; alt: string };
  /** 手順。上から①②…の番号を付けて出す。画像の中に同じ番号の印を入れて対応させる。画像の中に手順の文まで書いたときは省く */
  steps?: string[];
};

/** 手順の番号。画像の中の印と同じ①②…にする */
const STEP_MARKS = "①②③④⑤⑥⑦⑧⑨⑩";

/** 案内の前置きの文・画像・番号つきの手順 */
export function GuideContent({ lead, image, steps = [] }: Pick<Guide, "lead" | "image" | "steps">) {
  const { token } = theme.useToken();
  if (steps.length > STEP_MARKS.length) throw new Error(`手順は${STEP_MARKS.length}個までです`);
  return (
    // 最後の物とボタンの間も、物どうしの間（margin）と同じにする。確認のダイアログのボタンの上は marginSM のため、差を下に足す
    <Flex vertical gap={token.margin} style={{ paddingBottom: token.margin - token.marginSM }}>
      {lead && <Typography.Text>{lead}</Typography.Text>}
      {/* 画像と分かるよう、枠で囲む */}
      {image && (
        <Card size="small">
          <Image src={image.src} alt={image.alt} width="100%" preview={false} />
        </Card>
      )}
      {/* 手順がないときは、空の行の分の余白を残さないよう描かない */}
      {steps.length > 0 && (
        <Flex vertical gap={token.marginXXS}>
          {steps.map((step, i) => (
            <Typography.Text key={STEP_MARKS[i]}>
              {STEP_MARKS[i]} {step}
            </Typography.Text>
          ))}
        </Flex>
      )}
    </Flex>
  );
}

/** 案内のダイアログを開く関数。主のボタンで閉じて onOk を呼び、「閉じる」では何もしない */
export function useGuideDialog() {
  const dialog = useDialog();
  const { width } = useDesignValues().guideDialog;
  return useMemo(
    () =>
      ({ lead, image, steps, ...props }: Guide, onOk: () => void) => {
        dialog.info({
          ...props,
          content: <GuideContent lead={lead} image={image} steps={steps} />,
          width,
          okCancel: true,
          cancelText: "閉じる",
          onOk,
        });
      },
    [dialog, width]
  );
}
