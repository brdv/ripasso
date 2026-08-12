import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import StudyCard from "./StudyCard.svelte";

const item = {
  card: {
    id: "word:ora",
    type: "word" as const,
    it: "ora",
    nl: "uur",
    wordType: "noun",
    gender: "f",
    article: "l'",
  },
  dir: "nl_it" as const,
};

describe("StudyCard", () => {
  it("renders the prompt and delegates reveal actions", async () => {
    const onReveal = vi.fn();
    render(StudyCard, {
      item,
      phase: "prompt",
      flow: "direct",
      position: 1,
      isLast: false,
      onReveal,
      onGrade: vi.fn(),
      onPaperNext: vi.fn(),
    });

    await expect.element(page.getByText("uur", { exact: true })).toBeInTheDocument();
    await page.getByRole("button", { name: "Toon antwoord" }).click();
    expect(onReveal).toHaveBeenCalledOnce();
  });

  it("shows grammatical hints on demand", async () => {
    render(StudyCard, {
      item,
      phase: "prompt",
      flow: "direct",
      position: 1,
      isLast: false,
      onReveal: vi.fn(),
      onGrade: vi.fn(),
      onPaperNext: vi.fn(),
    });

    await page.getByRole("button", { name: "Hint / uitleg" }).click();
    await expect.element(page.getByText("vrouwelijk")).toBeInTheDocument();
  });
});
