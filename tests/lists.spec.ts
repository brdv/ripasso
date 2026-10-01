import { expect, test } from "playwright/test";

async function openApp(page: import("playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

async function expectNoHorizontalOverflow(page: import("playwright/test").Page) {
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
  );
  expect(overflowing).toEqual([]);
}

test("creates a list with essere and practises only that list", async ({ page }) => {
  await openApp(page);

  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await page.getByLabel("Nieuwe lijst").fill("Week 1");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();

  await page.getByLabel("Toevoegen").fill("ESSERE");
  const results = page.getByRole("list", { name: "Zoekresultaten" });
  await results.getByRole("listitem").filter({ hasText: "essere" }).getByRole("button", { name: "Toevoegen" }).click();

  const current = page.getByRole("list", { name: "In deze lijst" });
  await expect(current.getByRole("listitem")).toHaveCount(1);
  await expect(results.getByRole("listitem").filter({ hasText: /^essere/ })).toHaveCount(0);
  await expect(page.getByText("In deze lijst · 1 werkwoord · 0 woorden")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.reload();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await page.getByLabel("Oefenen uit").selectOption({ label: "Week 1" });
  await page.getByText("Achteraf op papier", { exact: true }).click();
  await page.getByLabel("aantal kaarten per sessie").fill("100");
  await page.getByRole("button", { name: "Start sessie" }).click();

  // essere × 6 persons × the 3 tenses enabled by default.
  for (let i = 0; i < 17; i += 1) await page.getByRole("button", { name: "Volgende vraag" }).click();
  await page.getByRole("button", { name: "Naar nakijken" }).click();
  await expect(page.getByText("Nakijken - 18 kaarten")).toBeVisible();
  await expect(page.locator(".plrow").filter({ hasText: /Futuro|Condizionale/ })).toHaveCount(0);
  await expect(page.locator(".plrow").filter({ hasText: "sono" }).first()).toBeVisible();
});

test("survives corrupt list storage and unknown entries", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("ripasso_lists_v1", "{broken");
  });
  await openApp(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await expect(page.getByText("Je hebt nog geen lijsten.")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("opslag werkt niet");

  await page.evaluate(() =>
    localStorage.setItem(
      "ripasso_lists_v1",
      JSON.stringify({
        version: 1,
        lists: [{ id: "l1", name: "Oud", entryRefs: [{ entryId: "word:bestaat-niet" }, { entryId: "verb:avere" }] }],
      }),
    ),
  );
  await openApp(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await expect(page.getByText("1 werkwoord · 0 woorden")).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByLabel("Oefenen uit").selectOption({ label: "Oud" });
  await page.getByRole("button", { name: "Start sessie" }).click();
  await expect(page.getByText(/^1 \/ 15$/)).toBeVisible();
});

test("an empty list shows the menu warning", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await page.getByLabel("Nieuwe lijst").fill("Leeg");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await page.getByRole("button", { name: "Lijsten", exact: true }).click();
  await expect(page.getByText("0 werkwoorden · 0 woorden")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByLabel("Oefenen uit").selectOption({ label: "Leeg" });
  await page.getByRole("button", { name: "Start sessie" }).click();
  await expect(page.getByText(/Geen kaarten met deze keuzes/)).toBeVisible();
});
