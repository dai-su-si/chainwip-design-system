// 原子の欄の例。入力のパネルの中身を、12種類の原子の欄を上から並べるだけで作る（Form.Item・Row・Col・antd の入力の部品を書かない）。
// 種類ごとの口（文字数の上限と表示、組全体の説明、複数日付、名前を出さない複数行の文）も見せる。
// フォームの外で、改行を含む長い文を読むだけで出す表示だけの欄（DisplayField の multiline）も見せる。
import { App, Form } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import {
  CheckField,
  DateField,
  DisplayField,
  HeadedCard,
  ImageChoiceField,
  NumberField,
  PanelSaveButton,
  PanelPage,
  RangeField,
  RangeListField,
  SelectField,
  TagCloudField,
  TextAreaField,
  TextField,
  WordListField,
} from "chainwip-design-system";
import type { ImageChoice, RangeRow } from "chainwip-design-system";
import { GENRE_GROUPS } from "./books";
import type { Genre } from "./books";

type Branch = "main" | "east" | "west";
type Slip = "simple" | "none";

type LoanValues = {
  title: string;
  branch: Branch | undefined;
  days: ("sat" | "sun")[];
  lastName: string;
  firstName: string;
  loanDate: Dayjs | null;
  openFrom: Dayjs | null;
  openTo: Dayjs | null;
  fromMonth: Dayjs | null;
  toMonth: Dayjs | null;
  onLoan: boolean;
  pages: number | null;
  minBooks: number | null;
  maxBooks: number | null;
  checkDays: Dayjs[];
  caution: string;
  closed: RangeRow<Dayjs>[];
  genres: Genre[];
  keywords: string[];
  slip: Slip | undefined;
  hidden: boolean;
  note: string;
};

const INITIAL: LoanValues = {
  title: "星の見つけ方",
  branch: "main",
  days: ["sat"],
  lastName: "",
  firstName: "",
  loanDate: null,
  openFrom: null,
  openTo: null,
  fromMonth: null,
  toMonth: null,
  onLoan: true,
  pages: null,
  minBooks: null,
  maxBooks: null,
  checkDays: [],
  caution: "",
  closed: [],
  genres: [],
  keywords: ["星座", "天体観測"],
  slip: undefined,
  hidden: false,
  note: "",
};

const SLIPS: ImageChoice<Slip>[] = [
  { value: "simple", label: "簡易の貸出票", description: "書名と返却日だけを書く票です。" },
  { value: "none", label: "票なし", description: "票を書かずに貸し出します。" },
];

const CHECK_CALENDAR_START = dayjs("2026-11-01");

/** フォームの外で読むだけで出す、改行を含む長い文 */
const SYNOPSIS = [
  "星座の探し方を、季節ごとに説明する入門書です。",
  "",
  "・春: 北斗七星から春の大曲線をたどる",
  "・夏: 夏の大三角を目印にする",
  "・冬: オリオン座の三つ星から広げる",
].join("\n");

/** 終了の時刻で、開始と同じかより前を選べなくする（ポカヨケ） */
const afterStart = (start: Dayjs | null | undefined) => () =>
  start
    ? {
        disabledHours: () => Array.from({ length: start.hour() }, (_, h) => h),
        disabledMinutes: (h: number) => (h === start.hour() ? Array.from({ length: start.minute() + 1 }, (_, m) => m) : []),
      }
    : {};

export function FieldsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<LoanValues>();
  const openFrom = Form.useWatch("openFrom", form);
  const fromMonth = Form.useWatch("fromMonth", form);
  const closed = Form.useWatch("closed", form);
  const [classForm] = Form.useForm<LoanValues>();
  /** 欄の横の補助の操作。書名から分野の候補を、今の選択に足す（保存はしない） */
  const guessGenres = () => {
    const now = classForm.getFieldValue("genres") ?? [];
    classForm.setFieldValue("genres", now.includes("astro") ? now : [...now, "astro"]);
  };
  const savePanel = (title: string) => void message.success(`${title}を保存しました`);
  return (
    <PanelPage>
      <Form<LoanValues> name="loan" form={form} layout="vertical" initialValues={INITIAL} onFinish={() => savePanel("基本情報")}>
        <HeadedCard title="基本情報" extra={<PanelSaveButton />}>
          <DisplayField label="登録番号" value="B-0001" />
          <TextField<LoanValues>
            name="title"
            label="書名"
            required
            rules={[{ required: true, message: "書名を入れてください。" }]}
            maxLength={40}
          />
          <SelectField<LoanValues, Branch>
            name="branch"
            label="館"
            options={[
              { value: "main", label: "本館" },
              { value: "east", label: "東分館" },
              { value: "west", label: "西分館" },
            ]}
          />
          <SelectField<LoanValues, "sat" | "sun">
            name="days"
            label="開く曜日"
            multiple
            appearance="checks"
            options={[
              { value: "sat", label: "土曜" },
              { value: "sun", label: "日曜" },
            ]}
          />
          {/* 2つの欄を横に並べるだけの組（姓・名） */}
          <RangeField<LoanValues>
            kind="text"
            start={{ name: "lastName", label: "姓" }}
            end={{ name: "firstName", label: "名" }}
          />
          <DateField<LoanValues> name="loanDate" label="貸出日" />
          <RangeField<LoanValues>
            kind="time"
            start={{ name: "openFrom", label: "開館" }}
            end={{ name: "openTo", label: "閉館", dependencies: ["openFrom"], disabledTime: afterStart(openFrom) }}
          />
          {/* 3つ目の場所のチェック。付けると終了の月を直せない */}
          <RangeField<LoanValues>
            kind="month"
            start={{ name: "fromMonth", label: "開始月", required: true }}
            end={{ name: "toMonth", label: "終了月", disabledDate: (d) => Boolean(fromMonth && d.isBefore(fromMonth, "month")) }}
            check={{ name: "onLoan", text: "貸出中", disablesEnd: true }}
          />
          <NumberField<LoanValues> name="pages" label="ページ数" min={1} max={9999} />
          {/* 組全体の説明の文は、組の下に全幅で出す */}
          <RangeField<LoanValues>
            kind="number"
            start={{ name: "minBooks", label: "冊数下限", min: 0, max: 99 }}
            end={{ name: "maxBooks", label: "冊数上限", min: 0, max: 99, dependencies: ["minBooks"] }}
            groupExtra="1人が一度に借りる冊数がこの幅を外れると、貸出の画面に出ます。"
          />
          <DateField<LoanValues>
            name="checkDays"
            label="点検の日"
            multiple
            placeholder="日付を選択"
            defaultPickerValue={CHECK_CALENDAR_START}
          />
          <RangeListField<LoanValues>
            kind="time"
            name="closed"
            label="休館の時間"
            start={{ placeholder: "開始", ariaLabel: "休館の開始" }}
            end={{
              placeholder: "終了",
              ariaLabel: "休館の終了",
              control: (row) => ({ disabledTime: afterStart(closed?.[row]?.start) }),
            }}
          />
          <TextAreaField<LoanValues>
            name="note"
            label="メモ"
            extra="貸し出すときに気をつけることを書きます。"
            maxLength={200}
            showCount
          />
        </HeadedCard>
      </Form>
      <Form<LoanValues> name="classification" form={classForm} layout="vertical" initialValues={INITIAL} onFinish={() => savePanel("分類")}>
        <HeadedCard title="分類" extra={<PanelSaveButton />}>
          <TagCloudField<LoanValues, Genre>
            name="genres"
            label="分野"
            options={GENRE_GROUPS}
            extra="空のままでも保存できます。「分野推定」は書名から候補を足します。保存はしません。"
            assist={{ label: "分野推定", onClick: guessGenres }}
          />
          <WordListField<LoanValues> name="keywords" label="キーワード" extra="語を打って Enter で足します。" />
          <ImageChoiceField<LoanValues, Slip> name="slip" label="貸出票の形" options={SLIPS} />
          <CheckField<LoanValues> name="hidden" text="ほかの人に見せない" extra="付けると、作った人だけに見えます。" />
        </HeadedCard>
      </Form>
      <Form<LoanValues> name="caution" layout="vertical" initialValues={INITIAL} onFinish={() => savePanel("貸出の注意")}>
        {/* 欄の名前を出さず、見出しが名前の役をする文の欄。保存を押したときだけ検査する */}
        <HeadedCard title="貸出の注意" extra={<PanelSaveButton />}>
          <TextAreaField<LoanValues>
            name="caution"
            ariaLabel="貸出の注意"
            rows={{ minRows: 6, maxRows: 24 }}
            maxLength={2000}
            validateTrigger={[]}
            rules={[{ max: 2000, message: "2000文字以内で書いてください。" }]}
          />
        </HeadedCard>
      </Form>
      {/* フォームの外の表示だけの欄。Form で包まなくても、名前が上・値が下の同じ形で出る。multiline で改行をそのまま出す */}
      <HeadedCard title="書誌">
        <DisplayField label="書名" value="星の見つけ方" />
        <DisplayField label="あらすじ" value={SYNOPSIS} multiline />
      </HeadedCard>
    </PanelPage>
  );
}
