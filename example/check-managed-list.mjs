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
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`${width}px: 書籍番号の昇順・降順、通常画面のボタンを確認`);
  }
} finally {
  await browser.close();
}
