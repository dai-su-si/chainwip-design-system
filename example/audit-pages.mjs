import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { auditFields } from "./audit-fields.mjs";

const base = "http://localhost:5120/";
const output = new URL("../.data/ui-audit/", import.meta.url);
const findings = [];

async function openMenu(page, name) {
  const item = page.getByRole("menuitem", { name, exact: true });
  if (!(await item.isVisible())) {
    await page.getByRole("button", { name: "サイドメニューの開閉" }).click();
  }
  await item.click();
  await page.locator(".ant-drawer-mask").waitFor({ state: "hidden" });
}

function panelWithTitle(main, title) {
  return main.getByRole("heading", { name: title, exact: true })
    .locator("xpath=ancestor::*[@data-headed-card][1]");
}

async function auditActionPlacement(main, type, width) {
  const content = main.locator("[data-screen-type]");
  assert.equal(await content.getAttribute("data-screen-type"), type);
  if (type === "panels") {
    const column = await content.locator("[data-panel-column]").boundingBox();
    const ratio = column?.width / await main.evaluate((element) => element.clientWidth);
    assert.ok(width >= 1200 ? ratio < 0.8 : ratio < 1 && ratio > 0.8, "パネル構成型は所定の列幅を使う");
    const panels = content.locator("[data-panel-column] > .ant-card, [data-panel-column] > form > .ant-card, [data-panel-group-item] > .ant-card");
    assert.ok(await panels.count(), "パネル構成型にはパネルを置く");
    for (const panel of await panels.all()) {
      const heading = panel.getByRole("heading", { level: 2 }).and(panel.locator("[data-panel-title]"));
      assert.equal(await heading.count(), 1, "パネルごとに見出しを一つ置く");
      assert.ok((await heading.innerText()).trim(), "見出しにパネル名を入れる");
      assert.ok(await heading.evaluate((element) => {
        const row = element.closest("[data-panel-heading]");
        return row?.firstElementChild === element && element.childElementCount === 0;
      }), "パネルの見出しは先頭に文字だけを置く");
      const layout = await panel.evaluate((element) => {
        const heading = element.querySelector("[data-panel-heading]");
        const body = element.querySelector("[data-headed-card-body]");
        return {
          singleBody: heading?.nextElementSibling === body && body?.nextElementSibling === null,
          gap: body?.getBoundingClientRect().top - heading?.getBoundingClientRect().bottom,
        };
      });
      assert.ok(layout.singleBody && Math.abs(layout.gap - 24) <= 1, "共通パネルは見出しと一つの本文を24pxで分ける");
    }
    assert.equal(await content.locator("[data-page-actions]").count(), 0, "パネル構成型に画面単位のボタンを置かない");
  } else {
    const actions = content.locator("[data-page-actions]");
    await actions.getByRole("button", { name: "追加", exact: true }).waitFor();
    const box = await actions.boundingBox();
    const table = await content.locator(".ant-table-wrapper").boundingBox();
    const contentRight = await main.evaluate((element) => element.getBoundingClientRect().left + element.clientWidth - parseFloat(getComputedStyle(element).paddingRight));
    assert.ok(box && table && box.y + box.height <= table.y, "一覧全体の操作は表の上に置く");
    assert.ok(Math.abs(box.x + box.width - contentRight) <= 1, "一覧全体の操作はコンテンツ右端に揃える");
  }
  const outsideButtons = await main.getByRole("button").evaluateAll((buttons) =>
    buttons.filter((button) => !button.closest(
      "[data-page-actions], [data-list-filters], .ant-card, .ant-table-wrapper, .ant-alert",
    )).map((button) => button.getAttribute("aria-label") || button.textContent?.trim()),
  );
  assert.deepEqual(outsideButtons, [], "操作領域や操作対象の外側にボタンがある");
  const panelEdit = main.locator("[data-panel-actions]").getByRole("button", { name: "編集", exact: true });
  assert.equal(await panelEdit.count(), 0, "パネルの見出しに編集ボタンを置かない");
}

async function auditManagedList(page, main) {
  const list = main.getByRole("region", { name: "一覧管理", exact: true });
  await list.getByRole("cell", { name: "B1", exact: true }).waitFor();
  const outsideButtons = await main.getByRole("button").evaluateAll((buttons) =>
    buttons.filter((button) => !button.closest(".chainwip-managed-list"))
      .map((button) => button.getAttribute("aria-label") || button.textContent?.trim()),
  );
  assert.deepEqual(outsideButtons, [], "通常の一覧の外側に操作ボタンがある");
  await list.getByRole("button", { name: "追加", exact: true }).click();
  const create = page.getByRole("dialog", { name: "図書の追加" });
  const title = (dialog) => dialog.getByRole("textbox", { name: "書名" });
  assert.equal(await title(create).inputValue(), "");
  await title(create).fill("監査用の図書");
  await create.getByRole("button", { name: "保存", exact: true }).click();
  await create.waitFor({ state: "hidden" });
  await list.getByRole("cell", { name: "監査用の図書", exact: true }).waitFor();
  await list.getByRole("cell", { name: "B1", exact: true }).click();
  await page.getByRole("menuitem", { name: "編集", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "図書の編集" });
  assert.equal(await title(edit).inputValue(), "はじめての園芸");
  await edit.getByRole("button", { name: "キャンセル", exact: true }).click();
  await edit.waitFor({ state: "hidden" });

  const actionButton = list.getByRole("button", { name: "操作: B1", exact: true });
  const trigger = (await actionButton.isVisible()) ? actionButton
    : list.getByRole("row", { name: "操作: B1", exact: true });
  await trigger.press("Enter");
  const menuItem = page.getByRole("menuitem", { name: "編集", exact: true });
  await menuItem.waitFor();
  await page.waitForFunction(() => document.activeElement?.closest("[role=menu]"));
  await page.keyboard.press("Escape");
  await menuItem.waitFor({ state: "hidden" });
  await list.locator('[aria-label="操作: B1"]:focus').waitFor();

  const filter = page.getByRole("combobox", { name: "状態", exact: true });
  if (!(await filter.isVisible())) {
    await list.getByRole("button", { name: "ほかの絞り込み", exact: true }).click();
  }
  await filter.click();
  await page.locator(".ant-select-dropdown:visible .ant-select-item-option-content")
    .filter({ hasText: /^貸出中$/ }).click();
  assert.deepEqual(
    await list.locator("tbody tr.ant-table-row td:first-child").allTextContents(),
    ["B2", "B5"],
    "条件を選んだ後に、表示する行が絞り込まれる",
  );
  const actions = list.locator("[data-page-actions]");
  assert.equal(await actions.getByRole("button").count(), 1, "通常時の一覧右上は追加だけ");
  assert.match(await actions.getByRole("button", { name: "追加", exact: true }).getAttribute("class"), /ant-btn-primary/);
  await page.reload();
  await list.getByRole("cell", { name: "B1", exact: true }).waitFor();
  await page.goto(new URL("/managed-books?state=error", base).href);
  const retry = actions.getByRole("button", { name: "再試行", exact: true });
  await retry.waitFor();
  assert.equal(await actions.getByRole("button").count(), 2, "取得失敗時の一覧右上は再試行と追加だけ");
  await actions.getByRole("button", { name: "追加", exact: true }).waitFor();
  await retry.click();
  await list.getByText("一覧を読み込めませんでした", { exact: true }).waitFor({ state: "hidden" });
  await list.getByRole("cell", { name: "B1", exact: true }).waitFor();
  assert.equal(page.url(), new URL("/managed-books", base).href);
  await page.goto(new URL("/managed-books?state=error", base).href);
  await openMenu(page, "標準一覧");
  await list.getByRole("cell", { name: "B1", exact: true }).waitFor();
  await page.goBack();
  await list.getByText("一覧を読み込めませんでした", { exact: true }).waitFor();
  await page.goForward();
  await list.getByRole("cell", { name: "B1", exact: true }).waitFor();
}

async function auditTableWidths(page, width) {
  await page.goto(new URL("/fixtures/table-width.html", base).href);
  const fixture = page.locator("[data-table-width-fixture]");
  const table = fixture.getByRole("table");
  await table.getByRole("cell", { name: "Oracle Database", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  const duration = table.getByRole("columnheader", { name: "期間", exact: true });
  assert.equal((await duration.boundingBox()).width, 144, "短い値の列は共通の幅になる");
  await fixture.screenshot({ path: fileURLToPath(new URL(`issue11-table-${width}.png`, output)) });

  await fixture.evaluate((element) => { element.style.width = "320px"; });
  assert.equal((await duration.boundingBox()).width, 144, "表の利用幅が増えても短い列の幅は変わらない");

  await fixture.evaluate((element) => { element.style.width = "200px"; });
  assert.equal((await duration.boundingBox()).width, 144, "表の利用幅が狭くても短い列の幅は変わらない");
  const scroll = fixture.locator(".ant-table-content");
  assert.ok(await scroll.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    return element.scrollLeft > 0;
  }), "列が収まらない場合は表の中で横スクロールできる");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "表の外は横スクロールしない");
  await fixture.screenshot({ path: fileURLToPath(new URL(`issue11-table-scroll-${width}.png`, output)) });
}

async function auditUniformSave(page, width) {
  await page.goto(new URL("/fields?save=default", base).href);
  const saves = page.getByRole("main").getByRole("button", { name: "保存", exact: true });
  assert.equal(await saves.count(), 3);
  for (const save of await saves.all()) assert.match(await save.getAttribute("class"), /ant-btn-default/);
  await saves.first().click();
  await page.getByText("基本情報を保存しました", { exact: true }).waitFor();
  await page.screenshot({ path: fileURLToPath(new URL(`panel-save-default-${width}.png`, output)) });
}

async function auditPanelWidthContinuity(browser) {
  const page = await browser.newPage({ viewport: { width: 1199, height: 844 } });
  try {
    await page.goto(new URL("/fields", base).href);
    const column = page.locator("[data-panel-column]");
    await column.waitFor();
    const previous = await column.boundingBox();
    await page.setViewportSize({ width: 1200, height: 844 });
    const next = await column.boundingBox();
    assert.ok(next.width >= previous.width && next.width <= previous.width + 1,
      `画面幅1199pxから1200pxで本文の幅が不連続になる (${previous.width} → ${next.width}px)`);
    await page.screenshot({ path: fileURLToPath(new URL("fields-panel-width-1200.png", output)), animations: "disabled" });
  } finally {
    await page.close();
  }
}

async function auditListLoading(page, width) {
  const list = page.getByRole("region", { name: "一覧管理", exact: true });
  const table = list.locator("[data-chainwip-table]");
  const skeleton = table.locator("[data-chainwip-skeleton-row]");
  const book = table.getByRole("cell", { name: "B1", exact: true });

  await page.goto(new URL("/managed-books?state=loading", base).href);
  await skeleton.first().waitFor();
  assert.equal(await table.getAttribute("aria-busy"), "true");
  assert.equal(await skeleton.first().getAttribute("aria-hidden"), "true");
  assert.equal(await book.count(), 0);
  assert.equal(await table.getByRole("button", { name: /^操作:/ }).count(), 0);
  await list.getByText("一覧を読み込み中です", { exact: true }).waitFor();
  await page.screenshot({
    path: fileURLToPath(new URL(`managed-list-loading-${width}.png`, output)),
    animations: "disabled",
  });
  await openMenu(page, "標準一覧");
  await book.waitFor();
  assert.equal(await skeleton.count(), 0);
  assert.equal(await table.getAttribute("aria-busy"), "false");

  await page.goto(new URL("/managed-books?state=refreshing", base).href);
  await book.waitFor();
  assert.equal(await table.getAttribute("aria-busy"), "true");
  assert.equal(await skeleton.count(), 0);
  await list.getByText("一覧を更新中です", { exact: true }).waitFor();
  await page.screenshot({
    path: fileURLToPath(new URL(`managed-list-refreshing-${width}.png`, output)),
    animations: "disabled",
  });
  await book.click();
  await page.getByRole("menuitem", { name: "編集", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "図書の編集" });
  assert.equal(await dialog.getByRole("textbox", { name: "書名" }).inputValue(), "はじめての園芸");
  await dialog.getByRole("button", { name: "キャンセル", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await openMenu(page, "標準一覧");
  await book.waitFor();
  assert.equal(await table.getAttribute("aria-busy"), "false");
}

async function assertRoute(page, path, label, heading) {
  const breadcrumb = page.getByRole("navigation", { name: "パンくず" });
  await breadcrumb.getByText(label, { exact: true }).waitFor();
  assert.equal(page.url(), new URL(path, base).href);
  assert.equal(await breadcrumb.innerText(), label, "同じ階層の画面名を親項目に含めない");
  assert.equal(await breadcrumb.locator("svg, img, [role=img]").count(), 0, "パンくずは文字だけにする");
  assert.equal(await breadcrumb.locator("[aria-current=page]").innerText(), label);
  const menuItem = page.getByRole("menuitem", { name: label, exact: true });
  if (await menuItem.isVisible()) {
    assert.ok(await menuItem.evaluate((item) => item.classList.contains("ant-menu-item-selected")));
  }
  if (heading) {
    await page.getByRole("main").getByRole("heading", { name: heading, exact: true }).waitFor();
  }
}

async function auditRouting(page) {
  await page.goto(base);
  await assertRoute(page, "/books", "図書");
  await openMenu(page, "入力の例");
  await assertRoute(page, "/fields", "入力の例", "基本情報");
  await openMenu(page, "この例について");
  await assertRoute(page, "/about", "この例について", "この例について");
  await page.goBack();
  await assertRoute(page, "/fields", "入力の例", "基本情報");
  await page.goForward();
  await assertRoute(page, "/about", "この例について", "この例について");
  await page.reload();
  await assertRoute(page, "/about", "この例について", "この例について");
  await page.goto(new URL("/fields/", base).href);
  await assertRoute(page, "/fields", "入力の例", "基本情報");
  await page.goto(new URL("/books/missing", base).href);
  await assertRoute(page, "/books/missing", "ページが見つかりません", "ページが見つかりません");
  await page.getByRole("button", { name: "図書一覧に戻る" }).click();
  await assertRoute(page, "/books", "図書");
}

async function auditLayoutTokens(page, width) {
  await page.goto(new URL("/managed-books?layout=custom", base).href);
  const table = page.getByRole("region", { name: "一覧管理", exact: true }).getByRole("table");
  const columnWidth = async (name) => (await table.getByRole("columnheader", { name, exact: true }).boundingBox()).width;
  assert.equal(await columnWidth("書籍番号"), 128);
  if (width < 768) {
    assert.equal(await columnWidth("書名"), 160);
    assert.equal(await table.getByRole("columnheader", { name: "操作", exact: true }).count(), 0);
  } else {
    assert.equal(await columnWidth("操作"), 72);
  }
  await page.screenshot({ path: fileURLToPath(new URL(`layout-list-${width}.png`, output)), animations: "disabled" });

  await page.goto(new URL("/fields?layout=custom", base).href);
  const title = page.getByRole("heading", { name: "基本情報", exact: true });
  await title.waitFor();
  const gaps = await title.evaluate((heading) => {
    const panel = heading.closest("[data-headed-card]");
    const [first, next] = panel.querySelectorAll(".ant-form-item-vertical");
    const label = first.querySelector("label").getBoundingClientRect();
    const content = first.querySelector(".ant-form-item-control-input-content > :first-child").getBoundingClientRect();
    return {
      headingToBody: label.top - heading.getBoundingClientRect().bottom,
      formLabelGap: content.top - label.bottom,
      formItemGap: next.querySelector("label").getBoundingClientRect().top - content.bottom,
      betweenPanels: parseFloat(getComputedStyle(panel.closest("[data-panel-column]")).rowGap),
    };
  });
  assert.deepEqual(gaps, { headingToBody: 28, formLabelGap: 12, formItemGap: 16, betweenPanels: 16 });
  await page.screenshot({ path: fileURLToPath(new URL(`layout-fields-${width}.png`, output)), animations: "disabled" });

  await page.goto(new URL("/about?layout=custom", base).href);
  const actionPanel = panelWithTitle(page.getByRole("main"), "操作");
  const items = actionPanel.locator("[data-panel-action-item]");
  await items.first().waitFor();
  const itemLayout = await items.evaluateAll(([first, second]) => ({
    betweenActions: second.getBoundingClientRect().top - first.getBoundingClientRect().bottom,
    relatedContent: first.children[1].getBoundingClientRect().top - first.children[0].getBoundingClientRect().bottom,
  }));
  assert.deepEqual(itemLayout, { betweenActions: 0, relatedContent: 8 });
}

const pages = [
  {
    id: "books",
    route: "/books",
    label: "図書",
    type: "list",
    async check(page, main) {
      const list = main.getByRole("region", { name: "一覧管理", exact: true });
      const book = list.getByRole("row").filter({ hasText: "はじめての園芸" });
      await book.getByText("貸出可", { exact: true }).waitFor();
      const search = page.getByRole("searchbox", { name: "書名を検索", exact: true });
      if (!(await search.isVisible())) {
        await list.getByRole("button", { name: "ほかの絞り込み", exact: true }).click();
      }
      await search.fill("星の見つけ方");
      await search.press("Enter");
      await list.getByRole("cell", { name: "星の見つけ方", exact: true }).waitFor();
      await book.waitFor({ state: "hidden" });
      await page.reload();
      await book.waitFor();
      await auditRouting(page);
    },
  },
  { id: "managed-list", route: "/managed-books", label: "標準一覧", type: "list", check: auditManagedList },
  {
    id: "about",
    route: "/about",
    label: "この例について",
    type: "panels",
    async check(page, main) {
      const about = panelWithTitle(main, "この例について");
      await about.waitFor();
      const aboutBody = about.locator("[data-headed-card-body]");
      assert.equal(await aboutBody.locator(":scope > *").count(), 1, "説明専用パネルは説明を一つにまとめる");
      assert.match(await aboutBody.innerText(), /再読み込みで最初に戻ります/);
      assert.equal(await about.getByRole("button").count(), 0, "説明専用パネルに操作ボタンを置かない");
      const actions = panelWithTitle(main, "操作").locator("[data-panel-action-item]");
      const actionGaps = await actions.evaluateAll((items) => items.map((item, index) => {
        const [hint, button] = item.children;
        return {
          within: button.getBoundingClientRect().top - hint.getBoundingClientRect().bottom,
          before: index === 0 ? null : item.getBoundingClientRect().top - items[index - 1].getBoundingClientRect().bottom,
        };
      }));
      assert.equal(actionGaps.length, 4);
      for (const { within, before } of actionGaps) {
        assert.ok(Math.abs(within - 8) <= 1 && (before === null || Math.abs(before - 16) <= 1), "操作の補足はそのボタンに所属する");
      }
      const choices = panelWithTitle(main, "貸出票の形").getByRole("radiogroup");
      assert.ok(await choices.evaluate((group) => (
        group.nextElementSibling?.id === group.getAttribute("aria-describedby")
        && Math.abs(group.nextElementSibling.getBoundingClientRect().top - group.getBoundingClientRect().bottom - 8) <= 1
      )), "貸出票の補足は選択部品の直後に置く");
      const actionPanel = panelWithTitle(main, "操作");
      const exportButton = actionPanel.getByRole("button", { name: "書き出し", exact: true });
      const helpButton = actionPanel.getByRole("button", { name: "使い方", exact: true });
      assert.equal(await actionPanel.locator("button.ant-btn-primary").count(), 1);
      const downloadPending = page.waitForEvent("download");
      await exportButton.click();
      await actionPanel.locator('button[aria-busy="true"]').waitFor();
      assert.equal(await helpButton.getAttribute("aria-busy"), null);
      let downloadCount = 0;
      const countDownload = () => { downloadCount += 1; };
      page.on("download", countDownload);
      await exportButton.evaluate((button) => button.click());
      const download = await downloadPending;
      page.off("download", countDownload);
      assert.equal(downloadCount, 1);
      assert.equal(download.suggestedFilename(), "図書一覧.csv");
      const exportDialog = page.getByRole("dialog", { name: "書き出し" });
      await exportDialog.getByText(/件の図書を書き出しました/).waitFor();
      await exportDialog.getByRole("button", { name: "閉じる", exact: true }).last().click();
      await exportDialog.waitFor({ state: "hidden" });
      await main.getByRole("button", { name: "使い方", exact: true }).click();
      const notice = page.getByRole("dialog");
      await notice.getByText(/左のメニュー/).waitFor();
      await notice.getByRole("button", { name: "閉じる", exact: true }).last().click();
      await notice.waitFor({ state: "hidden" });

      const recent = panelWithTitle(main, "最近見た図書");
      const loans = panelWithTitle(main, "貸出中の図書");
      const reservations = panelWithTitle(main, "予約した図書");
      const group = main.locator("[data-panel-group]");
      const [firstBox, secondBox] = await Promise.all([recent.boundingBox(), loans.boundingBox()]);
      if (page.viewportSize().width >= 768) {
        assert.equal(firstBox.y, secondBox.y);
        assert.equal(firstBox.height, secondBox.height);
      } else {
        assert.ok(secondBox.y > firstBox.y + firstBox.height);
        assert.notEqual(firstBox.height, secondBox.height);
      }
      await group.screenshot({ path: fileURLToPath(new URL(`panel-group-${page.viewportSize().width}.png`, output)) });
      for (const panel of [recent, loans, reservations]) {
        const table = panel.getByRole("table");
        await table.getByRole("columnheader", { name: "書名", exact: true }).waitFor();
        assert.equal(await table.getByRole("columnheader", { name: "操作", exact: true }).count(), 0);
      }
      await reservations.getByRole("table").getByText("予約した図書はありません。", { exact: true }).waitFor();
      await recent.getByRole("cell", { name: "はじめての園芸", exact: true }).click();
      await main.locator('[data-screen-type="list"]').waitFor();
      await openMenu(page, "この例について");
      const clearHistory = main.getByRole("button", { name: "閲覧履歴を消去", exact: true });
      assert.match(await clearHistory.getAttribute("class"), /ant-btn-dangerous/);
      await clearHistory.click();
      const clearDialog = page.getByRole("dialog").filter({ hasText: "閲覧履歴を消去しますか？" });
      await clearDialog.getByRole("button", { name: "キャンセル", exact: true }).click();
      await recent.getByRole("cell", { name: "はじめての園芸", exact: true }).waitFor();
      await clearHistory.click();
      await clearDialog.getByRole("button", { name: "消去", exact: true }).click();
      await recent.getByText("最近見た図書はありません。", { exact: true }).waitFor();
      const openLoan = loans.getByRole("button", { name: "図書一覧を開く（星の見つけ方）", exact: true });
      await openLoan.focus();
      await page.keyboard.press("Enter");
      await main.locator('[data-screen-type="list"]').waitFor();
      await openMenu(page, "この例について");
    },
  },
  {
    id: "fields",
    route: "/fields",
    label: "入力の例",
    type: "panels",
    async check(page, main, reportFinding) {
      assert.equal(await main.locator("[data-panel-actions] button.ant-btn-primary").count(), 3);
      await auditFields(page, reportFinding);
    },
  },
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1280, 390]) {
    for (const screen of pages) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      page.setDefaultTimeout(8000);
      const reportFinding = (finding) => findings.push({ width, screen: screen.id, ...finding });
      page.on("pageerror", (error) => reportFinding({ id: "page-error", message: error.message }));
      try {
        const response = await page.goto(new URL(screen.route, base).href);
        assert.equal(response?.status(), 200);
        await assertRoute(page, screen.route, screen.label);
        const main = page.getByRole("main");
        await screen.check(page, main, reportFinding);
        if (screen.id === "managed-list") await auditListLoading(page, width);
        await auditActionPlacement(main, screen.type, width);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "ページが横にはみ出す");
        if (screen.id === "fields") {
          await auditLayoutTokens(page, width);
          await auditUniformSave(page, width);
          await auditTableWidths(page, width);
          await page.goto(new URL(screen.route, base).href);
          await assertRoute(page, screen.route, screen.label);
        }
      } catch (error) {
        reportFinding({ id: "check-failed", message: error.message });
      } finally {
        const image = new URL(`${screen.id}-${width}.png`, output);
        try {
          await page.screenshot({ path: fileURLToPath(image), fullPage: true, animations: "disabled" });
        } catch (error) {
          reportFinding({ id: "screenshot-failed", message: error.message });
        }
        await page.close();
      }
      const failures = findings.filter((finding) => finding.width === width && finding.screen === screen.id);
      console.log(`${width}px ${screen.id} ${failures.length ? "不合格" : "検査項目は合格"}`);
      for (const failure of failures) console.error(`  ${failure.id} ${failure.message}`);
    }
  }
  await auditPanelWidthContinuity(browser);
  const widePage = await browser.newPage({ viewport: { width: 1680, height: 900 } });
  await widePage.goto(new URL("/about", base).href);
  const group = widePage.locator("[data-panel-group]");
  await group.waitFor();
  const positions = await group.locator("[data-headed-card]").evaluateAll((cards) =>
    cards.map((card) => {
      const { top, left, height } = card.getBoundingClientRect();
      return { top, left, height };
    }),
  );
  assert.equal(positions.length, 3);
  assert.ok(positions.every(({ top, height }) => top === positions[0].top && height === positions[0].height));
  assert.equal(new Set(positions.map(({ left }) => left)).size, 3);
  await group.screenshot({ path: fileURLToPath(new URL("panel-group-1680.png", output)) });
} finally {
  await browser.close();
}
process.exitCode = findings.length ? 1 : 0;
