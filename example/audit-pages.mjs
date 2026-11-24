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
    const panels = content.locator("[data-panel-column] > .ant-card, [data-panel-column] > form > .ant-card");
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
  await page.reload();
  await list.getByRole("cell", { name: "B1", exact: true }).waitFor();
  await page.goto(new URL("/managed-books?state=error", base).href);
  await list.locator("[data-page-actions]").getByRole("button", { name: "再試行", exact: true }).click();
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
      assert.equal(actionGaps.length, 3);
      for (const { within, before } of actionGaps) {
        assert.ok(Math.abs(within - 8) <= 1 && (before === null || Math.abs(before - 16) <= 1), "操作の補足はそのボタンに所属する");
      }
      const choices = panelWithTitle(main, "貸出票の形").getByRole("radiogroup");
      assert.ok(await choices.evaluate((group) => (
        group.nextElementSibling?.id === group.getAttribute("aria-describedby")
        && Math.abs(group.nextElementSibling.getBoundingClientRect().top - group.getBoundingClientRect().bottom - 8) <= 1
      )), "貸出票の補足は選択部品の直後に置く");
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        main.getByRole("button", { name: "書き出し", exact: true }).click(),
      ]);
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
      for (const panel of [recent, loans, reservations]) {
        const table = panel.getByRole("table");
        await table.getByRole("columnheader", { name: "書名", exact: true }).waitFor();
        assert.equal(await table.getByRole("columnheader", { name: "操作", exact: true }).count(), 0);
      }
      await reservations.getByRole("table").getByText("予約した図書はありません。", { exact: true }).waitFor();
      await recent.getByRole("cell", { name: "はじめての園芸", exact: true }).click();
      await main.locator('[data-screen-type="list"]').waitFor();
      await openMenu(page, "この例について");
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
        await auditActionPlacement(main, screen.type, width);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "ページが横にはみ出す");
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
} finally {
  await browser.close();
}
process.exitCode = findings.length ? 1 : 0;
