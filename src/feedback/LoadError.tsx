// 読み込めなかったときの表示。空の表や0で「ない」と見せず、何を読めなかったかと理由を出す。
// 何を読んだか（what）は使う側が渡す。
import { Alert } from "antd";

/** 読み込みの誤りの文「{what}を読み込めませんでした（理由）。再読み込みしてください。」 */
export function loadErrorText(error: unknown, what: string): string {
  const reason = error instanceof Error ? error.message.replace(/。$/, "") : "";
  return `${what}を読み込めませんでした${reason ? `（${reason}）` : ""}。再読み込みしてください。`;
}

/** 読み込み中に押されたときの理由。ボタンは読み込み中にせず、押したときにこの文をダイアログで出す */
export function loadingText(what: string): string {
  return `${what}を読み込み中です。読み込み終えてから、もう一度押してください。`;
}

export type LoadErrorProps = {
  /** null なら何も出さない（呼ぶ側が `a.error ?? b.error` を渡せるようにするため） */
  error: unknown;
  /** 読もうとしたものの名前（例: 「図書」） */
  what: string;
};

/** 読み込みの誤り */
export function LoadError({ error, what }: LoadErrorProps) {
  if (error == null) return null;
  return <Alert type="error" showIcon title={loadErrorText(error, what)} />;
}
