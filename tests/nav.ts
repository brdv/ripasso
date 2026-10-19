import type { Page } from "playwright/test";

/** Clicks one of the main navigation links. */
export async function navigate(page: Page, name: "Oefenen" | "Lijsten" | "Woorden") {
  await page.getByRole("navigation", { name: "Hoofdmenu" }).getByRole("link", { name, exact: true }).click();
}
