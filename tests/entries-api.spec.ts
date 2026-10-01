import { expect, test } from "playwright/test";

test("serves the base entries from D1 instead of data.json", async ({ page, request }) => {
  const response = await request.get("/api/entries");
  expect(response.ok()).toBe(true);
  const entries = (await response.json()) as { id: string }[];
  expect(entries.map((entry) => entry.id)).toContain("verb:essere");

  const requested: string[] = [];
  page.on("request", (req) => requested.push(new URL(req.url()).pathname));
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await expect(page.getByText(/werkwoordskaarten/)).toBeVisible();
  expect(requested).not.toContain("/data.json");
});
