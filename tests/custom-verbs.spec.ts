import { expect, test } from "playwright/test";

async function openApp(page: import("playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

test("creates a verb with one tense and practises only that tense", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await page.getByLabel("Nieuwe lijst").fill("Eigen ww");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await page.getByRole("button", { name: "Nieuw werkwoord" }).click();

  await page.getByLabel("Infinitief (Italiaans)").fill("parlare");
  await page.getByLabel("Nederlands", { exact: true }).fill("praten");
  await page.getByLabel("presente io Italiaans").fill("parlo");
  await page.getByLabel("presente io Nederlands").fill("ik praat");
  await page.getByLabel("presente tu Italiaans").fill("parli");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByText("Vul ook het Nederlands in.")).toBeVisible();
  await expect(page.getByText(/half ingevuld/)).toBeVisible();

  // The grid fits at phone width; only its own container may scroll.
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => !element.closest(".grid-scroll"))
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
  );
  expect(overflowing).toEqual([]);

  await page.getByLabel("presente tu Nederlands").fill("jij praat");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByText("In deze lijst · 1 werkwoord · 0 woorden")).toBeVisible();

  await page.getByRole("button", { name: "Lijsten", exact: true }).click();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByLabel("Oefenen uit").selectOption({ label: "Eigen ww" });
  await page.getByText("Achteraf op papier", { exact: true }).click();
  await page.getByRole("button", { name: "Start sessie" }).click();
  await page.getByRole("button", { name: "Volgende vraag" }).click();
  await page.getByRole("button", { name: "Naar nakijken" }).click();
  await expect(page.getByText("Nakijken - 2 kaarten")).toBeVisible();
  await expect(page.locator(".plrow").filter({ hasText: "presente" })).toHaveCount(2);

  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByText("presente", { exact: true }).click();
  await page.getByRole("button", { name: "Start sessie" }).click();
  await expect(page.getByText(/Geen kaarten met deze keuzes/)).toBeVisible();
});
