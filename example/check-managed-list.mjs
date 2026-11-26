import assert from "node:assert/strict";
import { chromium } from "playwright";

const listUrl = "http://localhost:5120/managed-books";
const browser = await chromium.launch();

try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(listUrl);
    const list = page.getByRole("region", { name: "一覧管理", exact: true });
    const idHeader = list.getByRole("columnheader", { name: "書籍番号", exact: true });
    const visibleIds = () => list.locator("tbody tr.ant-table-row td:first-child").allTextContents();
    await idHeader.click();
    assert.equal(await idHeader.getAttribute("aria-sort"), "ascending");
    assert.deepEqual(await visibleIds(), ["B1", "B2", "B3", "B4", "B5"]);
    await idHeader.click();
    assert.equal(await idHeader.getAttribute("aria-sort"), "descending");
    assert.deepEqual(await visibleIds(), ["B6", "B5", "B4", "B3", "B2"]);
    await idHeader.press("Enter");
    assert.deepEqual(await visibleIds(), ["B1", "B2", "B3", "B4", "B5"]);
    assert.equal(await page.getByRole("button", {
      name: /^(通常|空|初回読み込み|再取得中|取得失敗|長文・多列)$/,
    }).count(), 0);

    const table = list.locator("[data-chainwip-table]");
    const dataRows = table.locator("tbody tr.ant-table-row");
    const firstRowHeight = (rows) => rows.first().evaluate((row) => row.getBoundingClientRect().height);
    const dataHeight = await firstRowHeight(dataRows);
    const dataCount = await dataRows.count();
    await page.goto(`${listUrl}?state=loading`);
    const skeletonRows = table.locator("[data-chainwip-skeleton-row]");
    await skeletonRows.first().waitFor();
    assert.equal(await skeletonRows.count(), dataCount, "以前の表示件数を仮の行に反映する");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await skeletonRows.first().waitFor();
    await page.evaluate(async () => {
      for (let frame = 0; frame < 6; frame++) await new Promise(requestAnimationFrame);
    });
    assert.equal(await skeletonRows.count(), 10, "履歴も高さ制限もない一覧は読み込み中に10行を保つ");
    assert.equal(await idHeader.getAttribute("tabindex"), null, "読み込み中の並べ替え見出しを Tab の対象にしない");
    assert.ok(Math.abs(await firstRowHeight(skeletonRows) - dataHeight) < 1, "仮の行と実データの行の高さを揃える");
    assert.ok(await skeletonRows.first().locator(".ant-skeleton-input").evaluateAll((bars) => bars.every((bar) => {
      const cell = bar.closest("td").getBoundingClientRect();
      const placeholder = bar.getBoundingClientRect();
      return placeholder.width > 0 && placeholder.left >= cell.left && placeholder.right <= cell.right;
    })), "仮の表示をそれぞれのセルに収める");
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`${width}px: 書籍番号の並べ替え、通常画面のボタン、読み込み中の行を確認`);
  }
} finally {
  await browser.close();
}
