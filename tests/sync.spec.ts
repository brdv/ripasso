import { expect, test, type Page } from "playwright/test";

async function waitReady(page: Page) {
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

async function register(page: Page, email: string) {
  await page.goto("/account-aanmaken");
  await waitReady(page);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill("geheim-wachtwoord");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await expect(page.getByText(email)).toBeVisible();
  await waitReady(page);
}

test("moves guest progress, lists, and words into a new account once", async ({ page }, testInfo) => {
  const email = `sync-${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  // As a guest: a custom word in a list, and progress on it.
  await page.goto("/");
  await waitReady(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await page.getByLabel("Nieuwe lijst").fill("Gastdieren");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await page.getByRole("button", { name: "Nieuw woord" }).click();
  await page.getByLabel("Italiaans").fill("gattone");
  await page.getByLabel("Nederlands").fill("de kater");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await page.getByRole("button", { name: "Lijsten", exact: true }).click();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByLabel("Oefenen uit").selectOption({ label: "Gastdieren" });
  await page.getByRole("button", { name: "Start sessie" }).click();
  await page.getByRole("button", { name: "Toon antwoord" }).click();
  await page.getByRole("button", { name: /Goed/ }).click();
  await expect(page.getByText("Voortgang opgeslagen in deze browser.")).toBeVisible();

  await register(page, email);
  const progress = await page.request.get("/api/progress");
  const rows = (await progress.json()) as Record<string, { box: number }>;
  expect(Object.values(rows)).toEqual([expect.objectContaining({ box: 2 })]);

  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await expect(page.getByText("Gastdieren")).toBeVisible();
  await page.getByRole("button", { name: "Mijn woorden" }).click();
  await expect(page.getByText("gattone")).toBeVisible();

  // After logging out, new guest data is not imported on the next login in this browser.
  await page.getByRole("button", { name: "Lijsten", exact: true }).click();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Uitloggen" }).click();
  await waitReady(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await page.getByLabel("Nieuwe lijst").fill("Later");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await expect(page.getByRole("heading", { name: "Lijst bewerken" })).toBeVisible();

  await page.goto("/inloggen");
  await waitReady(page);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill("geheim-wachtwoord");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page.getByText(email)).toBeVisible();
  await waitReady(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await expect(page.getByText("Gastdieren")).toBeVisible();
  await expect(page.getByText("Later")).toHaveCount(0);

  // Clearing progress while logged in clears the server copy.
  await page.getByRole("button", { name: "Menu" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Voortgang wissen" }).click();
  await expect(page.getByText("Voortgang gewist.")).toBeVisible();
  await expect.poll(async () => (await (await page.request.get("/api/progress")).json()) as object).toEqual({});
});
