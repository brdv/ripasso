import { expect, test } from "playwright/test";
import { navigate } from "./nav";

test("browses the words and shows a built-in verb with all its forms", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await navigate(page, "Woorden");

  const words = page.getByRole("list", { name: "Woorden" });
  await page.getByText("Werkwoorden", { exact: true }).click();
  await expect(page.getByText("12 werkwoorden · 0 woorden")).toBeVisible();
  await page.getByLabel("Zoeken").fill("ZIJN");
  await expect(words.getByRole("listitem")).toHaveCount(1);
  await words.getByRole("link", { name: "essere" }).click();

  await expect(page.getByRole("heading", { name: "essere" })).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "essere" }).first()).toBeVisible();
  const presente = page.locator(".tense-card").filter({ hasText: "presente" });
  await expect(presente.getByRole("row")).toHaveCount(6);
  await expect(presente.getByRole("row", { name: "loro" })).toContainText("zij zijn");
  await expect(page.locator(".tense-card")).toHaveCount(5);

  // Built-in entries cannot be edited.
  await expect(page.getByText(/kan niet bewerkt worden/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Bewerken" })).toHaveCount(0);

  // The filters survive going back, and the detail page has its own URL.
  await page.getByRole("link", { name: "Terug" }).click();
  await expect(page.getByLabel("Zoeken")).toHaveValue("ZIJN");
  await page.goBack();
  await page.reload();
  await expect(page.getByRole("heading", { name: "essere" })).toBeVisible();
});
