// example/ の画面を、幅1280と390で撮る。先に `npm run example` で開発サーバー（5120）を起動しておく。
// 出力: .data/screens/example/<幅>_<場面>.png。ページの誤り（pageerror）があれば終了コード1（使う側の撮影と同じ基準）。
// console の error（antdの開発時の警告など）は、数と文を出すだけにする。
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = "http://localhost:5120/";
const OUT = fileURLToPath(new URL("../.data/screens/example/", import.meta.url));
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
const consoleErrors = [];
for (const width of [1280, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width > 500 ? 800 : 844 } });
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(`${width} console: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${width} pageerror: ${e.message}`));
  const shot = (name) => page.screenshot({ path: `${OUT}${width}_${name}.png` });

  await page.goto(BASE);
  await page.getByText("はじめての園芸").waitFor();
  await page.waitForTimeout(300);
  await shot("01_list");

  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(300);
  await shot("02_add");
  await page.getByRole("dialog").getByLabel("書名").fill("風の名前の辞典");
  // タグクラウドの欄（TagCloud）。まとまりに分けた選択肢から選ぶ
  await page.getByRole("dialog").getByLabel("分野").click();
  // antd は読み上げ用の隠れた option も置くため、見える選択肢（.ant-select-item-option）を押す
  const option = (name) => page.locator(".ant-select-item-option", { hasText: name });
  await option("天文").waitFor();
  await page.waitForTimeout(300);
  await shot("02b_tagcloud");
  await option("天文").click();
  await option("海の生き物").click();
  await page.getByRole("dialog").locator(".ant-modal-title").click();
  await page.waitForTimeout(300);
  await shot("02c_tagcloud_selected");
  await page.getByRole("dialog").getByRole("button", { name: "保存" }).click();
  await page.waitForTimeout(100);
  await shot("03_saving");
  await page.getByText("追加しました").waitFor();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await shot("04_added");

  await page.getByText("星の見つけ方").click();
  await page.getByRole("menuitem", { name: "編集" }).waitFor();
  await page.waitForTimeout(400);
  await shot("05_row_menu");
  await page.getByRole("menuitem", { name: "編集" }).click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(300);
  await shot("06_edit");
  await page.getByRole("dialog").getByRole("button", { name: "キャンセル" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });

  await page.getByText("やさしい料理の本").click();
  await page.getByRole("menuitem", { name: "削除" }).click();
  await page.locator(".ant-modal-confirm-title").waitFor();
  await page.waitForTimeout(300);
  await shot("07_delete_confirm");
  await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();
  await page.getByText("削除しました").waitFor();
  await shot("08_deleted");

  await page.getByRole("combobox").first().click().catch(() => {});
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByText("はじめての園芸").waitFor();
  if (width < 992) {
    await page.getByRole("button", { name: "サイドメニューの開閉" }).click();
    await page.waitForTimeout(400);
    await shot("09_menu");
    await page.getByRole("menuitem", { name: "この例について" }).click();
  } else {
    await page.getByRole("menuitem", { name: "この例について" }).click();
  }
  await page.getByText("部品だけで組んだ例です").waitFor();
  await shot("10_about");
  // 進み具合のダイアログ（ProgressModal）の終わり
  await page.getByRole("button", { name: "書き出し" }).click();
  await page.getByText("件の図書を書き出しました。").waitFor();
  await page.waitForTimeout(300);
  await shot("12_progress");
  await page.getByRole("dialog").getByRole("button", { name: "閉じる", exact: true }).last().click();
  // 読むだけの文のダイアログ（useNotice）
  await page.getByRole("button", { name: "使い方" }).click();
  await page.getByRole("dialog").getByText("左のメニュー").waitFor();
  await page.waitForTimeout(300);
  await shot("13_notice");
  await page.getByRole("dialog").getByRole("button", { name: "閉じる", exact: true }).last().click();
  await page.getByRole("dialog").waitFor({ state: "detached" }).catch(() => {});
  // 手順を案内するダイアログ（useGuideDialog）
  await page.getByRole("button", { name: "貸出の始め方" }).click();
  await page.getByRole("dialog").getByText("①").waitFor();
  await page.waitForTimeout(400);
  await shot("14_guide");
  await page.getByRole("dialog").getByRole("button", { name: "閉じる", exact: true }).last().click();
  await page.getByRole("dialog").waitFor({ state: "detached" }).catch(() => {});
  // 画像付きのカードから選ぶ欄（ImageChoiceCards）
  await page.getByText("詳しい貸出票", { exact: true }).click();
  await page.getByText("貸出票の形").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot("15_image_choice");
  if (width >= 992) {
    // ロゴなしで畳んだサイドメニュー（開閉のボタンが常に見える）
    await page.getByRole("button", { name: "サイドメニューの開閉" }).click();
    await page.mouse.move(width - 10, 10);
    await page.waitForTimeout(400);
    await shot("11_collapsed");
  }
  await page.close();
}
await browser.close();
console.log(`撮影: ${OUT}`);
console.log(`ページの誤り: ${errors.length}件`);
for (const e of errors) console.log(e);
console.log(`console の error: ${consoleErrors.length}件`);
for (const e of new Set(consoleErrors)) console.log(e);
process.exit(errors.length ? 1 : 0);
