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

  // The grid fits at phone width; only its own container may scroll.
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

test("explains how to build each tense in a dialog that fits at phone width", async ({ page }) => {
  await page.goto("/woorden/nieuw?soort=werkwoord");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();

  const blocks = page.locator(".tense-block");
  for (let index = 0; index < (await blocks.count()); index++) {
    const block = blocks.nth(index);
    if (!(await block.evaluate((element) => (element as HTMLDetailsElement).open))) {
      await block.locator("summary").click();
    }
    const trigger = block.getByRole("button", { name: "Hoe vorm je deze tijd?" });
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(/^[A-Z][a-z ]+$/);
    // The endings table fits without scrolling sideways, also on a phone. Only the card with
    // irregular forms may scroll inside itself.
    const [scrollWidth, clientWidth] = await dialog
      .locator(".theory-scroll")
      .evaluate((element) => [element.scrollWidth, element.clientWidth]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    const overflowing = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("dialog[open] *")]
        .filter((element) => !element.closest(".theory-card"))
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
    );
    expect(overflowing).toEqual([]);

    // Escape closes the dialog and hands focus back to the button that opened it.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }

  // The close button and a click on the backdrop close it too.
  await page.getByRole("button", { name: "Hoe vorm je deze tijd?" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Sluiten" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "Hoe vorm je deze tijd?" }).first().click();
  await page.mouse.click(2, 2);
  await expect(page.getByRole("dialog")).toBeHidden();
});
