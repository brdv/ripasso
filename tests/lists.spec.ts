import { expect, test } from "playwright/test";
import { navigate } from "./nav";

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

  await navigate(page, "Lijsten");
  await page.getByLabel("Nieuwe lijst").fill("Week 1");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();

  await page.getByLabel("Zoeken").fill("ESSERE");
  const essere = page.getByRole("listitem").filter({ hasText: /^essere/ });
  await essere.getByRole("button", { name: "Toevoegen" }).click();

  await expect(page.getByText("1 werkwoord · 0 woorden")).toBeVisible();
  await expect(essere).toHaveCount(1);
  await expect(essere.getByRole("button", { name: "Toevoegen" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  // A fresh page load: the list must come back from storage.
  await page.goto("/");
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
  await navigate(page, "Lijsten");
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
  await navigate(page, "Lijsten");
  await expect(page.getByText("1 werkwoord · 0 woorden")).toBeVisible();
  await navigate(page, "Oefenen");
  await page.getByLabel("Oefenen uit").selectOption({ label: "Oud" });
  await page.getByRole("button", { name: "Start sessie" }).click();
  await expect(page.getByText(/^1 \/ 15$/)).toBeVisible();
});

test("an empty list shows the menu warning", async ({ page }) => {
  await openApp(page);
  await navigate(page, "Lijsten");
  await page.getByLabel("Nieuwe lijst").fill("Leeg");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await navigate(page, "Lijsten");
  await expect(page.getByText("0 werkwoorden · 0 woorden")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await navigate(page, "Oefenen");
  await page.getByLabel("Oefenen uit").selectOption({ label: "Leeg" });
  await page.getByRole("button", { name: "Start sessie" }).click();
  await expect(page.getByText(/Geen kaarten met deze keuzes/)).toBeVisible();
});

test("edits an own word from the list editor and toggles entries in place", async ({ page }, testInfo) => {
  await openApp(page);
  await navigate(page, "Lijsten");
  await page.getByLabel("Nieuwe lijst").fill("Keuken");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await page.waitForURL(/\/lijsten\/[\w-]+$/);
  const editorUrl = page.url();

  await page.getByRole("button", { name: "Nieuw woord" }).click();
  await page.getByLabel("Italiaans").fill("pentola");
  await page.getByLabel("Nederlands").fill("de pan");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page).toHaveURL(editorUrl);

  // Own entries in the editor link straight to their edit form, which returns to the editor.
  const pentola = page.getByRole("listitem").filter({ hasText: /^pentola/ });
  await pentola.getByRole("link", { name: "Bewerken" }).click();
  await page.getByLabel("Nederlands").fill("de kookpan");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page).toHaveURL(editorUrl);
  await expect(pentola).toContainText("de kookpan");

  // The search and the Werkwoorden filter apply to everything shown.
  await page.getByLabel("Zoeken").fill("pan");
  await page.getByText("Werkwoorden", { exact: true }).click();
  await expect(pentola).toHaveCount(0);
  await page.getByText("Alles", { exact: true }).click();
  await page.getByLabel("Zoeken").fill("");

  if (testInfo.project.name === "mobile") {
    // One list: rows toggle in place, and a chip narrows it to the list's entries.
    await expect(pentola.getByRole("button", { name: "✓ In lijst" })).toHaveAttribute("aria-pressed", "true");
    await page.getByText("In deze lijst (1)").click();
    await expect(page.getByRole("list", { name: "Woorden" }).getByRole("listitem")).toHaveCount(1);
    await pentola.getByRole("button", { name: "✓ In lijst" }).click();
    await expect(page.getByText("Nog leeg. Voeg woorden en werkwoorden toe.")).toBeVisible();
    await page.getByText("In deze lijst (0)").click();
    await expect(pentola.getByRole("button", { name: "Toevoegen" })).toHaveAttribute("aria-pressed", "false");
  } else {
    // Two columns: available entries on the left, the list on the right.
    const current = page.getByRole("list", { name: "In deze lijst" });
    await expect(current.getByRole("listitem")).toHaveCount(1);
    await current.getByRole("button", { name: "Verwijderen" }).click();
    await expect(page.getByRole("list", { name: "Beschikbaar" }).getByText("pentola")).toBeVisible();
  }
  await expect(page.getByText("0 werkwoorden · 0 woorden")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
