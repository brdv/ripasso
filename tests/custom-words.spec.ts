import { expect, test } from "playwright/test";

async function openApp(page: import("playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

test("creates a custom word, adds it to a list, and practises it", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await page.getByLabel("Nieuwe lijst").fill("Dieren");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();

  await page.getByRole("button", { name: "Nieuw woord" }).click();
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByText("Vul het Italiaanse woord in.")).toBeVisible();

  await page.getByLabel("Italiaans").fill("gattino");
  await page.getByLabel("Nederlands").fill("het katje");
  await page.getByLabel("Lidwoord").selectOption("il");
  await page.getByLabel("Geslacht").selectOption("m");
  await page.getByRole("button", { name: "Opslaan" }).click();

  const current = page.getByRole("list", { name: "In deze lijst" });
  await expect(current.getByRole("listitem")).toHaveCount(1);
  await expect(current.getByText("eigen")).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await page.getByLabel("Oefenen uit").selectOption({ label: "Dieren" });
  await page.getByRole("button", { name: "Start sessie" }).click();
  await expect(page.getByText("1 / 1")).toBeVisible();
  await expect(page.getByText("het katje")).toBeVisible();
  await page.getByRole("button", { name: "Toon antwoord" }).click();
  await expect(page.getByText("gattino").first()).toBeVisible();
});

test("edits and deletes a custom word without breaking lists", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await page.getByRole("button", { name: "Mijn woorden" }).click();
  await page.getByRole("button", { name: "Nieuw woord" }).click();
  await page.getByLabel("Italiaans").fill("vita");
  await page.getByLabel("Nederlands").fill("woning");
  await expect(page.getByText(/Er bestaat al een woord "vita"/)).toBeVisible();
  await page.getByLabel("Italiaans").fill("casetta");
  await page.getByRole("button", { name: "Opslaan" }).click();

  const mine = page.getByRole("list", { name: "Mijn woorden" });
  await mine.getByRole("button", { name: "Bewerken" }).click();
  await expect(page.getByLabel("Italiaans")).toHaveValue("casetta");
  await page.getByLabel("Nederlands").fill("het huisje");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(mine.getByText("het huisje")).toBeVisible();

  // Shared entries have no edit controls: only own entries are listed here.
  await expect(mine.getByRole("listitem")).toHaveCount(1);

  await page.getByRole("button", { name: "Lijsten", exact: true }).click();
  await page.getByLabel("Nieuwe lijst").fill("Huis");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await page.getByLabel("Toevoegen").fill("casetta");
  await page.getByRole("list", { name: "Zoekresultaten" }).getByRole("button", { name: "Toevoegen" }).click();
  await page.getByRole("button", { name: "Lijsten", exact: true }).click();
  await expect(page.getByText("0 werkwoorden · 1 woord")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Mijn woorden" }).click();
  await mine.getByRole("button", { name: "Verwijderen" }).click();
  await expect(page.getByText("Je hebt nog geen eigen woorden of werkwoorden.")).toBeVisible();

  await page.getByRole("button", { name: "Lijsten", exact: true }).click();
  await expect(page.getByText("0 werkwoorden · 0 woorden")).toBeVisible();
  await page.getByRole("button", { name: "Bewerken" }).click();
  await expect(page.getByRole("heading", { name: "Lijst bewerken" })).toBeVisible();
});
