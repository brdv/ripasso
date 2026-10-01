import { expect, test, type Page } from "playwright/test";

async function openApp(page: Page) {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

async function openAuthPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

function uniqueEmail(project: string) {
  return `test-${project}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test("registers, keeps server data across logout and login, and leaves guest data alone", async ({ page }, testInfo) => {
  const email = uniqueEmail(testInfo.project.name);

  // A guest list that must survive logging in and out untouched.
  await openApp(page);
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await page.getByLabel("Nieuwe lijst").fill("Gastlijst");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();

  await openAuthPage(page, "/account-aanmaken");
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill("kort");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await expect(page.getByText("Je wachtwoord moet minstens 8 tekens hebben.")).toBeVisible();
  await page.getByLabel("Wachtwoord").fill("geheim-wachtwoord");
  await page.getByRole("button", { name: "Account aanmaken" }).click();

  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await expect(page.getByText("Gastlijst")).toHaveCount(0);
  const basis = page.getByRole("listitem").filter({ hasText: "Basis" });
  await expect(basis.getByText("vast")).toBeVisible();
  await expect(basis.getByRole("button", { name: "Bewerken" })).toHaveCount(0);

  await page.getByLabel("Nieuwe lijst").fill("Serverlijst");
  await page.getByRole("button", { name: "Nieuwe lijst" }).click();
  await page.getByRole("button", { name: "Nieuw woord" }).click();
  await page.getByLabel("Italiaans").fill("serverino");
  await page.getByLabel("Nederlands").fill("het servertje");
  const saved = page.waitForResponse((response) => response.url().endsWith("/api/lists/") || /\/api\/lists\/[^/]+$/.test(response.url()));
  await page.getByRole("button", { name: "Opslaan" }).click();
  await saved;
  await expect(page.getByRole("list", { name: "In deze lijst" }).getByText("serverino")).toBeVisible();

  await page.getByRole("button", { name: "Uitloggen" }).click();
  await expect(page.getByRole("link", { name: "Inloggen" })).toBeVisible();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await expect(page.getByText("Gastlijst")).toBeVisible();
  await expect(page.getByText("Serverlijst")).toHaveCount(0);

  await openAuthPage(page, "/inloggen");
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill("verkeerd-wachtwoord");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page.getByText("E-mailadres of wachtwoord klopt niet.")).toBeVisible();
  await page.getByLabel("Wachtwoord").fill("geheim-wachtwoord");
  await page.getByRole("button", { name: "Inloggen" }).click();

  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Lijsten beheren" }).click();
  await expect(page.getByText("0 werkwoorden · 1 woord")).toBeVisible();
  await page.getByRole("button", { name: "Mijn woorden" }).click();
  await expect(page.getByText("serverino")).toBeVisible();
});
