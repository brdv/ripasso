import { expect, test } from "playwright/test";
import { navigate } from "./nav";

async function openApp(page: import("playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

test("creates a verb with one tense and practises only that tense", async ({ page }) => {
  await openApp(page);
  await navigate(page, "Lijsten");
  await page.getByLabel("Nieuwe lijst").fill("Eigen ww");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await page.getByRole("button", { name: "Nieuw werkwoord" }).click();

  await page.getByLabel("Infinitief (Italiaans)").fill("parlare");
  await page.getByLabel("Nederlands", { exact: true }).fill("praten");
  await page.getByLabel("presente io Italiaans").fill("parlo");
  await page.getByLabel("presente io Nederlands").fill("praat");
  await page.getByLabel("presente tu Italiaans").fill("parli");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByText("Vul ook het Nederlands in.")).toBeVisible();
  await expect(page.getByText(/half ingevuld/)).toBeVisible();

  await page.getByText("Hoe vorm je deze tijd?").first().click();
  await expect(page.getByRole("cell", { name: "finisco", exact: true })).toBeVisible();

  // The grid and the theory fit at phone width; only their own containers may scroll.
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => !element.closest(".grid-scroll"))
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
  );
  expect(overflowing).toEqual([]);

  await page.getByLabel("presente tu Nederlands").fill("praat");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByText("1 werkwoord · 0 woorden")).toBeVisible();

  await navigate(page, "Oefenen");
  await page.getByLabel("Oefenen uit").selectOption({ label: "Eigen ww" });
  await page.getByText("Achteraf op papier", { exact: true }).click();
  await page.getByRole("button", { name: "Start sessie" }).click();
  await page.getByRole("button", { name: "Volgende vraag" }).click();
  await page.getByRole("button", { name: "Naar nakijken" }).click();
  await expect(page.getByText("Nakijken - 2 kaarten")).toBeVisible();
  await expect(page.locator(".plrow").filter({ hasText: "presente" })).toHaveCount(2);
  // The Dutch pronoun is added in front of the typed form.
  await expect(page.locator(".plrow").filter({ hasText: "ik praat" })).toHaveCount(1);
  await expect(page.locator(".plrow").filter({ hasText: "jij praat" })).toHaveCount(1);

  await page.getByRole("button", { name: "Stoppen" }).click();
  await page.getByText("presente", { exact: true }).click();
  await page.getByRole("button", { name: "Start sessie" }).click();
  await expect(page.getByText(/Geen kaarten met deze keuzes/)).toBeVisible();
});
