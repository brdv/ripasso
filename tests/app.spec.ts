import { expect, test } from "playwright/test";

async function openApp(page: import("playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

test("completes a direct study session and saves progress", async ({ page }, testInfo) => {
  await openApp(page);

  await expect(page.getByText(/werkwoordskaarten/)).toBeVisible();
  await page.getByLabel("aantal kaarten per sessie").fill("1");
  await page.getByRole("button", { name: "Start sessie" }).click();

  await expect(page.getByText("1 / 1")).toBeVisible();
  await page.getByRole("button", { name: "Toon antwoord" }).click();
  await page.screenshot({ path: testInfo.outputPath("revealed-card.png"), fullPage: true });
  await page.getByRole("button", { name: /Goed/ }).click();

  await expect(page.getByText("1 / 1 goed")).toBeVisible();
  await expect(page.getByText("Voortgang opgeslagen in deze browser.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("ripasso_progress_v2"))).not.toBeNull();
});

test("completes the paper review flow", async ({ page }, testInfo) => {
  await openApp(page);

  await page.getByText("Achteraf op papier", { exact: true }).click();
  await page.getByLabel("aantal kaarten per sessie").fill("2");
  await page.getByRole("button", { name: "Start sessie" }).click();
  await page.getByRole("button", { name: "Volgende vraag" }).click();
  await page.getByRole("button", { name: "Naar nakijken" }).click();

  await expect(page.getByText("Nakijken - 2 kaarten")).toBeVisible();
  await page.locator(".pl-check").first().check();
  await page.screenshot({ path: testInfo.outputPath("paper-review.png"), fullPage: true });
  await page.getByRole("button", { name: "Verwerk: 1 goed, 1 fout" }).click();
  await expect(page.getByText("1 / 2 goed")).toBeVisible();
});

test("renders the menu without horizontal overflow", async ({ page }, testInfo) => {
  await openApp(page);
  await expect(page.getByRole("button", { name: "Start sessie" })).toBeVisible();

  const overflowingElements = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
  );
  expect(overflowingElements).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("menu.png"), fullPage: true });
});

test("navigates with the navbar, deep links, and the back button", async ({ page }) => {
  await openApp(page);
  const nav = page.getByRole("navigation", { name: "Hoofdmenu" });
  await expect(nav.getByRole("link", { name: "Oefenen" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Lijsten" }).click();
  await expect(page).toHaveURL(/\/lijsten$/);
  await page.getByLabel("Nieuwe lijst").fill("Link");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await expect(page).toHaveURL(/\/lijsten\/[\w-]+$/);

  // The list editor survives a reload and the browser's back button returns to the overview.
  await page.reload();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await expect(page.getByLabel("Naam")).toHaveValue("Link");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Lijsten" })).toBeVisible();

  await nav.getByRole("link", { name: "Woorden" }).click();
  await expect(page.getByRole("heading", { name: "Mijn woorden en werkwoorden" })).toBeVisible();

  // A session hides the navbar; "Stoppen" returns to the practice settings.
  await nav.getByRole("link", { name: "Oefenen" }).click();
  await page.getByRole("button", { name: "Start sessie" }).click();
  await expect(page).toHaveURL(/\/sessie$/);
  await expect(nav).toHaveCount(0);
  await page.getByRole("button", { name: "Stoppen" }).click();
  await expect(page.getByRole("button", { name: "Start sessie" })).toBeVisible();

  // Without a running session, /sessie goes back to the start.
  await page.goto("/sessie");
  await expect(page.getByRole("button", { name: "Start sessie" })).toBeVisible();
});
