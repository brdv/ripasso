import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import TenseTheory from "./TenseTheory.svelte";

describe("TenseTheory", () => {
  it("opens the theory with endings tables generated from the rules", async () => {
    render(TenseTheory, { tense: "futuro_semplice" });

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await page.getByRole("button", { name: "Hoe vorm je deze tijd?" }).click();
    await expect.element(page.getByRole("dialog", { name: "Hoe vorm je de futuro semplice?" })).toBeVisible();

    await expect.element(page.getByRole("cell", { name: "parleremo" })).toBeVisible();
    await expect.element(page.getByRole("cell", { name: "dormiranno" })).toBeVisible();
    // The irregular stems come from the same rules the seed test checks.
    await expect.element(page.getByText("sar-")).toBeVisible();
    await expect.element(page.getByText("tra un mese")).toBeVisible();
  });

  it("shows the auxiliary and agreement in the passato prossimo", async () => {
    render(TenseTheory, { tense: "passato_prossimo" });
    await page.getByRole("button", { name: "Hoe vorm je deze tijd?" }).click();

    await expect.element(page.getByRole("cell", { name: "abbiamo parlato" })).toBeVisible();
    await expect.element(page.getByRole("cell", { name: "siamo arrivati/arrivate" })).toBeVisible();
  });
});
