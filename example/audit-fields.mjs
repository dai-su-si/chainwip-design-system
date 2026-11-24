import assert from "node:assert/strict";

export async function auditFields(page, reportFinding) {
  const main = page.getByRole("main");
  const basicInfo = main.getByRole("heading", { name: "基本情報", exact: true })
    .locator("xpath=ancestor::*[@data-headed-card][1]");
  const gaps = await basicInfo.evaluate((panel) => {
    const heading = panel.querySelector("[data-panel-title]").getBoundingClientRect();
    const fields = [...panel.querySelectorAll("[data-headed-card-body] .ant-form-item-vertical")].flatMap((item) => {
      const label = item.querySelector(":scope > .ant-form-item-row > .ant-form-item-label > label");
      if (!label || !/^(登録番号|書名\*?|館|開く曜日|姓)$/.test(label.textContent)) return [];
      const content = item.querySelector(":scope > .ant-form-item-row > .ant-form-item-control .ant-form-item-control-input-content > :first-child");
      return [{ name: label.textContent, top: label.getBoundingClientRect().top, bottom: content.getBoundingClientRect().bottom }];
    });
    return {
      headingToField: fields[0].top - heading.bottom,
      betweenFields: fields.slice(1).map((field, index) => ({
        pair: `${fields[index].name} → ${field.name}`,
        gap: field.top - fields[index].bottom,
      })),
    };
  });
  assert.ok(Math.abs(gaps.headingToField - 24) <= 1, `見出しと最初のラベルの間隔は24px（実測 ${gaps.headingToField}px）`);
  assert.equal(gaps.betweenFields.length, 4, "種類の異なる項目が続く4区間を検査する");
  for (const { pair, gap } of gaps.betweenFields) {
    assert.ok(Math.abs(gap - 20) <= 1, `${pair}の項目間隔は20px（実測 ${gap}px）`);
    assert.ok(gaps.headingToField > gap, "見出しから最初の項目までを項目間より広くする");
  }
  const fieldGaps = await main.locator(".ant-form-item-vertical").evaluateAll((items) => items.flatMap((item) => {
    const label = item.querySelector(":scope > .ant-form-item-row > .ant-form-item-label > label");
    if (!label || !/^(登録番号|書名\*?|館|開く曜日|あらすじ)$/.test(label.textContent)) return [];
    const content = item.querySelector(":scope > .ant-form-item-row > .ant-form-item-control .ant-form-item-control-input-content > :first-child");
    return [{ label: label.textContent, gap: content.getBoundingClientRect().top - label.getBoundingClientRect().bottom }];
  }));
  assert.equal(fieldGaps.length, 6, "入力欄・チェック群・単行および複数行の表示欄を検査する");
  for (const { label, gap } of fieldGaps) {
    assert.ok(Math.abs(gap - 8) <= 1, `${label}のラベルと内容の間隔は8px（実測 ${gap}px）`);
  }
  assert.equal(await main.locator(".ant-card .ant-alert-warning").count(), 0, "通常の入力パネルに警告帯を常設しない");
  const forms = main.locator("form");
  assert.equal(await forms.count(), 3, "編集パネルごとにフォームを持つ");
  for (const panel of await forms.locator(":scope > .ant-card").all()) {
    const actions = panel.locator("[data-panel-actions]");
    const saveBox = await actions.getByRole("button", { name: "保存", exact: true }).boundingBox();
    const panelBox = await panel.boundingBox();
    assert.ok(saveBox && panelBox);
    assert.ok(saveBox.x > panelBox.x + panelBox.width / 2 && saveBox.x + saveBox.width <= panelBox.x + panelBox.width);
    assert.ok(saveBox.y >= panelBox.y && saveBox.y - panelBox.y <= 40, "保存はパネル内の上端に揃える");
    assert.equal(await actions.getByRole("button").count(), 1, "この常時編集パネルには保存だけを置く");
  }
  const details = forms.first();
  const save = details.getByRole("button", { name: "保存", exact: true });

  const title = main.getByRole("textbox", { name: /^書名(?: \*)?$/ });
  assert.ok(await title.isEditable(), "最初から編集できる");
  const caution = main.getByRole("textbox", { name: "貸出の注意", exact: true });
  await caution.fill("返却日を確認する");
  assert.equal(await caution.inputValue(), "返却日を確認する", "パネルを開いた時点で入力できる");
  await title.fill("");
  await save.click();
  await main.getByText("書名を入れてください。", { exact: true }).waitFor();
  assert.equal(await caution.inputValue(), "返却日を確認する", "他のパネルの入力は維持する");
  const cautionForm = caution.locator("xpath=ancestor::form[1]");
  await cautionForm.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByText("貸出の注意を保存しました", { exact: true }).waitFor();
  assert.equal(await title.inputValue(), "", "別のパネルの保存は基本情報の入力を変えない");
  await title.fill("星の見つけ方");

  await main.getByRole("textbox", { name: /^開始月(?: \*)?$/ }).click();
  const months = page.locator(".ant-picker-dropdown:visible .ant-picker-month-panel");
  await months.locator(".ant-picker-cell-in-view:not(.ant-picker-cell-disabled)").first().click();
  await save.click();
  await page.getByText("基本情報を保存しました", { exact: true }).waitFor();

  const label = page.getByText("点検の日", { exact: true });
  const field = label.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' ant-form-item ')][1]");
  await label.waitFor();

  if (await page.getByText("点検の月", { exact: true }).count() > 0) {
    reportFinding({
      id: "fields-month-selection-reset",
      message: "点検の月が独立した入力欄として表示されています。点検日は1つのカレンダーで月をまたいで選べる必要があります。",
    });
    return;
  }

  await field.getByLabel("点検の日", { exact: true }).waitFor({ state: "attached" });
  await field.locator(".ant-picker-multiple").click();
  const calendar = page.locator(".ant-picker-dropdown:visible").filter({ has: page.locator(".ant-picker-date-panel") });
  await calendar.getByRole("button", { name: "月を選択", exact: true }).waitFor();
  const weekdayHeaders = calendar.getByRole("columnheader");
  await weekdayHeaders.last().waitFor();
  const daysOfWeek = await weekdayHeaders.allTextContents();
  if (daysOfWeek.join("") !== "日月火水木金土") {
    reportFinding({
      id: "fields-weekday-context",
      message: `点検日カレンダーに曜日の見出しが揃っていません。取得した表示は ${JSON.stringify(daysOfWeek)} です。`,
    });
  }

  await calendar.locator('[title="2026-11-30"]').click();
  await calendar.getByRole("button", { name: "翌月", exact: true }).click();
  await calendar.locator('[title="2026-12-31"]').click();
  await field.getByText(/^2026-12-31/).waitFor();
  if (!(await field.getByText(/^2026-11-30/).isVisible())) {
    reportFinding({
      id: "fields-month-selection-reset",
      message: "12月の点検日を追加すると、先に選んだ11月の点検日が失われます。",
    });
  }

  await calendar.getByRole("button", { name: "前月", exact: true }).click();
  await calendar.locator('[title="2026-11-30"]').waitFor();
  if (!(await calendar.locator('[title="2026-11-30"].ant-picker-cell-selected').isVisible())) {
    reportFinding({
      id: "fields-month-calendar-selection",
      message: "11月に戻ったときに、11月30日の選択がカレンダー上で確認できません。",
    });
  }
  assert.equal(await field.getByText(/^2026-12-31/).count(), 1);
  await page.keyboard.press("Escape");
  await main.evaluate((element) => element.scrollIntoView({ block: "start" }));
}
