// 追加・保存・削除の知らせ。
// データの書き方（どのライブラリで送るか）は知らず、使う側の onMutate・onSuccess・onError から呼ばれる形だけを持つ。
import type { MessageInstance } from "antd/es/message/interface";

/** 誤りを利用者向けの文にする */
export function errorText(error: unknown, fallback = "処理できませんでした。"): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * 追加・保存・削除の途中・終わり・誤りで呼ぶ処理。TData は送り先が返した値の型（使わないときは void のままで、onSuccess に渡さなくてよい）
 */
export type MutationLifecycle<TValues, TData = void> = {
  onMutate?: (values: TValues) => void;
  onSuccess?: (values: TValues, data: TData) => void;
  /** 雛形にはなく、error を足した。送り先が返した誤りの文（例: 同じ日には1件だけ登録できます）を通知に出すため */
  onError?: (values: TValues, error: Error) => void;
};

/**
 * 追加・保存・削除の知らせの文。どの画面も同じ文にする。追加の途中も編集と同じ「保存しています…」にし、終わりは「追加しました」
 */
export const NOTICE_TEXT = {
  create: { loading: "保存しています…", success: "追加しました", error: "追加できませんでした" },
  update: { loading: "保存しています…", success: "保存しました", error: "保存できませんでした" },
  delete: { loading: "削除しています…", success: "削除しました", error: "削除できませんでした" },
} as const;

/** 追加・保存・削除のほかの操作の知らせの文。使う側が操作ごとに渡す */
export type NoticeTexts<TValues, TData = void> = {
  /** 途中の知らせ（消えない）。なければ出さない */
  loading?: string;
  /** 終わりの知らせ。関数が null を返したら途中の知らせを消すだけ。なければ何もしない */
  success?: string | ((data: TData, values: TValues) => string | null);
  /** 誤りのときの文。送り先の文（errorText）がなければこれを出す。関数が null を返したら知らせを消すだけ */
  error: string | ((error: Error, values: TValues) => string | null);
  /** 誤りの知らせを出す秒数。なければ antd の既定 */
  errorDuration?: number;
};

/**
 * 知らせを出すだけの MutationLifecycle。
 * 途中は消えない知らせ（duration 0）を出し、同じ key で終わりの知らせに置き換える。誤りは誤りの文を出す（errorText）。
 * notice は、追加・保存・削除なら NOTICE_TEXT の種類（"create" など）、ほかの操作なら文（NoticeTexts）を渡す。
 * 画面ごとに同じ形を写していたため、1つにした。onSuccess は、知らせの後にダイアログを閉じるなどに使う
 */
export function notifyLifecycle<TValues, TData = void>(
  message: MessageInstance,
  key: string,
  notice: keyof typeof NOTICE_TEXT | NoticeTexts<TValues, TData>,
  onSuccess?: () => void,
): MutationLifecycle<TValues, TData> {
  const texts: NoticeTexts<TValues, TData> = typeof notice === "string" ? NOTICE_TEXT[notice] : notice;
  return {
    onMutate: () => {
      if (texts.loading) message.loading({ content: texts.loading, key, duration: 0 });
    },
    onSuccess: (values, data) => {
      if (texts.success !== undefined) {
        const text = typeof texts.success === "string" ? texts.success : texts.success(data, values);
        if (text === null) message.destroy(key);
        else message.success({ content: text, key });
      }
      onSuccess?.();
    },
    onError: (values, e) => {
      const fallback = typeof texts.error === "string" ? texts.error : texts.error(e, values);
      if (fallback === null) message.destroy(key);
      else {
        const duration = texts.errorDuration;
        message.error({ content: errorText(e, fallback), key, ...(duration ? { duration } : {}) });
      }
    },
  };
}
