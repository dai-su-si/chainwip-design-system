// 押した後に利用者から見えにくい処理（外部の呼び出しなど）の進み具合のダイアログ。
// 処理ごとに1行の文と線の進み具合を出し、ほかのものは出さない。文は使う側が渡す。
import { Button, Flex, Modal, Progress, Typography, theme } from "antd";

const { Text } = Typography;

export type ProgressStatus = "running" | "done" | "failed";

/** 1つの処理。1つの操作で複数の処理を行うときは、縦に並べて出す */
export type ProgressItem = {
  key: string;
  /** 線の上の1行（例: 「分類中…（2/3件）」） */
  text: string;
  /** 0〜100 */
  percent: number;
  status: ProgressStatus;
  /** 失敗したときの誤りの文 */
  error?: string;
};

/** 処理中の1行の最小表示時間。速く終わっても、処理したことが分かるようにする */
export const PROGRESS_MIN_MS = 1000;

/** 処理を待ち、最小表示時間に満たなければ、満ちるまで待ってから結果を返す */
export const atLeastMin = <T,>(work: Promise<T>, ms = PROGRESS_MIN_MS): Promise<T> =>
  Promise.all([work, new Promise((resolve) => setTimeout(resolve, ms))]).then(([value]) => value);

const PROGRESS_STATUS = { running: "active", done: "success", failed: "exception" } as const;

export type ProgressModalProps = {
  title: string;
  progresses: ProgressItem[];
  open: boolean;
  onClose: () => void;
};

/** 進み具合のダイアログ。ボタンは「閉じる」だけ */
export function ProgressModal({ title, progresses, open, onClose }: ProgressModalProps) {
  const { token } = theme.useToken();
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={
        <Button key="close" onClick={onClose}>
          閉じる
        </Button>
      }
    >
      <Flex vertical gap={token.margin}>
        {progresses.map((p) => (
          <Flex key={p.key} vertical gap={token.marginXXS}>
            <Text>{p.text}</Text>
            <Progress percent={p.percent} status={PROGRESS_STATUS[p.status]} />
            {p.error !== undefined && <Text type="danger">{p.error}</Text>}
          </Flex>
        ))}
      </Flex>
    </Modal>
  );
}
