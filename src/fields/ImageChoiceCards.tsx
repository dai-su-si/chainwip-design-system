// 画像付きのカードを並べ、1つを選ぶ入力。Form.Item の子として value・onChange で使う。
import { Card, Flex, Image, Typography, theme } from "antd";
import { Check, Plus, ZoomIn } from "lucide-react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { useDesignValues } from "../theme/designValues";

const { Text, Paragraph } = Typography;

export type ImageChoice<V extends string = string> = {
  value: V;
  /** カードの名前 */
  label: string;
  /** 名前の下に出す説明。長いときは決まった行数で省き、マウスを載せると全文を出す */
  description: string;
  /** カードの上に出す画像のURL。なければ「＋」の空の印を出す */
  image?: string;
};

export type ImageChoiceCardsProps<V extends string = string> = {
  options: readonly ImageChoice<V>[];
  value?: V;
  onChange?: (value: V) => void;
  /** Form.Item が渡す id（欄の名前と結び付ける） */
  id?: string;
  /** 操作に必要な補足。選択肢の下に表示する */
  hint?: string;
  /** 説明の最大の行数。既定は values.imageChoiceCards.descriptionRows */
  descriptionRows?: number;
};

export function ImageChoiceCards<V extends string = string>({
  options,
  value,
  onChange,
  id,
  hint,
  descriptionRows: givenRows,
}: ImageChoiceCardsProps<V>) {
  const { token } = theme.useToken();
  const { imageChoiceCards: values, panel } = useDesignValues();
  const hintId = useId();
  const descriptionRows = givenRows ?? values.descriptionRows;
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusVisible, setFocusVisible] = useState<number | null>(null);
  const selectedIndex = options.findIndex((o) => o.value === value);
  // 選んだカードか、選んでいなければ最初のカードだけを Tab で止まる場所にする（radiogroup の決まり）
  const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const choose = (i: number) => {
    const o = options[i];
    if (o && o.value !== value) onChange?.(o.value);
  };
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      const next = (i + step + options.length) % options.length;
      choose(next);
      refs.current[next]?.focus();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      choose(i);
    }
  };

  // カードの外枠は borderRadiusLG、内側の画像の枠は同じ画面の入力欄・ボタンと同じ borderRadius にする
  const framePadding = token.paddingSM;
  const frame: CSSProperties = {
    position: "relative",
    height: values.imageHeight,
    padding: token.paddingXS,
    borderRadius: token.borderRadius,
    background: token.colorFillQuaternary,
    overflow: "hidden",
  };
  const descriptionStyle: CSSProperties = {
    margin: 0,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    // 説明が短いカードも、行数の上限の高さを取り、カードごとの文の高さをそろえる
    minHeight: descriptionRows * token.fontSizeSM * token.lineHeightSM,
  };
  const pageHeight = values.imageHeight - token.paddingXS * 2;

  const choices = (
    <div
      id={id}
      role="radiogroup"
      aria-describedby={hint ? hintId : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${values.minCardWidth}px, 1fr))`,
        gap: token.margin,
      }}
    >
      {options.map((o, i) => {
        const selected = o.value === value;
        const mark: ReactNode = selected ? (
          // 選んだカードは、主の色の枠と、画像の右上の印で示す
          <Flex
            align="center"
            justify="center"
            aria-hidden
            style={{
              position: "absolute",
              top: token.paddingXS,
              right: token.paddingXS,
              width: values.checkMarkSize,
              height: values.checkMarkSize,
              borderRadius: "50%",
              background: token.colorPrimary,
              boxShadow: token.boxShadowTertiary,
              zIndex: 1,
            }}
          >
            <Check size={values.checkMarkSize * 0.65} strokeWidth={3} color={token.colorWhite} />
          </Flex>
        ) : null;
        return (
          <Card
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={selected}
            aria-label={`${o.label}。${o.description}`}
            tabIndex={i === focusIndex ? 0 : -1}
            hoverable
            onClick={() => choose(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onFocus={(e) => setFocusVisible(e.currentTarget.matches(":focus-visible") ? i : null)}
            onBlur={() => setFocusVisible(null)}
            // 選んだカードは主の色の枠にする。枠の太さは変えず、影で太く見せる。キーボードの焦点は antd の焦点の輪と同じ形にする
            style={{
              minWidth: 0,
              borderColor: selected ? token.colorPrimary : undefined,
              boxShadow: selected ? `0 0 0 1px ${token.colorPrimary}` : undefined,
              outline:
                focusVisible === i
                  ? `${token.lineWidthFocus}px solid ${token.colorPrimaryBorder}`
                  : "none",
              outlineOffset: 1,
            }}
            styles={{ body: { padding: framePadding } }}
          >
            <Flex vertical gap={token.paddingSM}>
              {o.image ? (
                // 画像はページ全体を枠の高さに収め、左右の中央に置く（どの書式も同じ規則で見せる）
                <Flex justify="center" style={frame}>
                  {mark}
                  {/* 画像を押すと拡大だけをし、選び直さない（見比べるときに今の値を変えないため）。画像の外の枠を押すと選ぶ */}
                  <span
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "inline-flex", maxWidth: "100%" }}
                  >
                    <Image
                      src={o.image}
                      alt={o.label}
                      height={pageHeight}
                      preview={{
                        // 拡大の覆いで画像を暗くせず、右下に拡大の印だけを出す
                        cover: {
                          coverNode: (
                            <Flex
                              align="center"
                              justify="center"
                              style={{
                                width: values.checkMarkSize + token.paddingXXS * 2,
                                height: values.checkMarkSize + token.paddingXXS * 2,
                                borderRadius: "50%",
                                background: token.colorBgMask,
                              }}
                            >
                              <ZoomIn size={values.checkMarkSize * 0.75} color={token.colorWhite} />
                            </Flex>
                          ),
                        },
                      }}
                      styles={{
                        root: { maxWidth: "100%" },
                        image: {
                          maxWidth: "100%",
                          objectFit: "contain",
                          background: token.colorBgContainer,
                          boxShadow: `0 0 0 1px ${token.colorBorderSecondary}`,
                        },
                        cover: {
                          inset: "auto",
                          right: token.paddingXXS,
                          bottom: token.paddingXXS,
                          background: "transparent",
                        },
                      }}
                    />
                  </span>
                </Flex>
              ) : (
                <Flex align="center" justify="center" style={frame}>
                  {mark}
                  <Plus size={token.fontSizeHeading2} color={token.colorTextTertiary} />
                </Flex>
              )}
              <Flex vertical gap={token.marginXXS} style={{ minWidth: 0 }}>
                <Text strong ellipsis={{ tooltip: o.label }}>
                  {o.label}
                </Text>
                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: descriptionRows, tooltip: o.description }}
                  style={descriptionStyle}
                >
                  {o.description}
                </Paragraph>
              </Flex>
            </Flex>
          </Card>
        );
      })}
    </div>
  );
  return hint ? (
    <Flex vertical gap={panel.relatedContent}>
      {choices}
      <Text id={hintId} type="secondary">{hint}</Text>
    </Flex>
  ) : choices;
}
