import { expect, test, type Browser, type Page, type TestInfo } from "playwright/test";

async function waitReady(page: Page) {
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}

async function newUser(browser: Browser, testInfo: TestInfo, name: string) {
  const context = await browser.newContext({ ...testInfo.project.use });
  const page = await context.newPage();
  const email = `${name}-${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/account-aanmaken");
  await waitReady(page);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill("geheim-wachtwoord");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await expect(page.getByText(email)).toBeVisible();
  await waitReady(page);
  return page;
}

test("shares a list by link, lets guests practise it, and lets others copy it", async ({ browser }, testInfo) => {
  // The owner builds a list with a private word and a shared verb, then shares it.
  const owner = await newUser(browser, testInfo, "owner");
  await owner.getByRole("button", { name: "Lijsten beheren" }).click();
  await owner.getByLabel("Nieuwe lijst").fill("Deelbaar");
  await owner.getByRole("button", { name: "Nieuwe lijst" }).click();
  await owner.getByRole("button", { name: "Nieuw woord" }).click();
  await owner.getByLabel("Italiaans").fill("condiviso");
  await owner.getByLabel("Nederlands").fill("gedeeld");
  await owner.getByRole("button", { name: "Opslaan" }).click();
  await owner.getByLabel("Toevoegen").fill("essere");
  await owner.getByRole("list", { name: "Zoekresultaten" }).getByRole("button", { name: "Toevoegen" }).click();
  await owner.getByRole("button", { name: "Lijsten", exact: true }).click();
  await owner.getByRole("button", { name: "Deel lijst" }).click();
  const link = owner.getByLabel("Link naar Deelbaar");
  await expect(link).toHaveValue(/\/l\/[A-Za-z0-9_-]{16,}$/);
  const shareUrl = new URL(await link.inputValue()).pathname;
  const overflowing = await owner.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
  );
  expect(overflowing).toEqual([]);

  // A guest practises it live and keeps progress locally.
  const guestContext = await browser.newContext({ ...testInfo.project.use });
  const guest = await guestContext.newPage();
  await guest.goto(shareUrl);
  await waitReady(guest);
  await expect(guest.getByText("Deelbaar")).toBeVisible();
  await expect(guest.getByText("1 werkwoord · 1 woord")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Kopieer naar mijn lijsten" })).toHaveCount(0);
  await guest.getByRole("link", { name: "Oefen deze lijst" }).click();
  await waitReady(guest);
  await expect(guest.getByLabel("Oefenen uit")).toHaveValue(/^gedeeld:/);
  await guest.getByText("Woorden", { exact: true }).click(); // verbs only
  await guest.getByRole("button", { name: "Start sessie" }).click();
  await expect(guest.getByText("1 / 15")).toBeVisible();
  await guest.getByRole("button", { name: "Toon antwoord" }).click();
  await guest.getByRole("button", { name: /Goed/ }).click();
  const stored = await guest.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ripasso_progress_v2") ?? "{}")));
  expect(stored).toEqual([expect.stringMatching(/^card:verb:essere:/)]);

  // Another user copies it.
  const friend = await newUser(browser, testInfo, "friend");
  await friend.goto(shareUrl);
  await waitReady(friend);
  await friend.getByRole("button", { name: "Kopieer naar mijn lijsten" }).click();
  await expect(friend.getByText("Gekopieerd naar je lijsten.")).toBeVisible();

  // The owner stops sharing and deletes the original; the link is gone, the copy keeps working.
  await owner.getByRole("button", { name: "Stop met delen" }).click();
  await expect(owner.getByRole("button", { name: "Deel lijst" })).toBeVisible();
  const gone = await guest.goto(shareUrl);
  expect(gone?.status()).toBe(404);
  owner.once("dialog", (dialog) => dialog.accept());
  await owner.getByRole("button", { name: "Verwijderen" }).click();
  await expect(owner.getByText("Deelbaar")).toHaveCount(0);

  await friend.goto("/");
  await waitReady(friend);
  await friend.getByRole("button", { name: "Lijsten beheren" }).click();
  await expect(friend.getByRole("listitem").filter({ hasText: "Deelbaar" }).getByText("1 werkwoord · 1 woord")).toBeVisible();
  await friend.getByRole("button", { name: "Menu" }).click();
  await friend.getByLabel("Oefenen uit").selectOption({ label: "Deelbaar" });
  await friend.getByText("Werkwoorden", { exact: true }).click(); // words only
  await friend.getByRole("button", { name: "Start sessie" }).click();
  await expect(friend.getByText("gedeeld", { exact: true })).toBeVisible();
});
