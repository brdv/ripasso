import { describe, expect, it } from "vitest";
import { buildSessionItems, defaultMenuState } from "./session";
import type { Card, Progress } from "./types";

const cards: Card[] = [
  {
    id: "verb:essere:presente:io",
    type: "verb",
    tense: "presente",
    person: "io",
    lemma: "essere",
    lemmaNl: "zijn",
    it: "sono",
    nl: "ik ben",
  },
  {
    id: "verb:essere:futuro_semplice:io",
    type: "verb",
    tense: "futuro_semplice",
    person: "io",
    lemma: "essere",
    lemmaNl: "zijn",
    it: "sarò",
    nl: "ik zal zijn",
  },
  { id: "word:cosa", type: "word", it: "cosa", nl: "ding", wordType: "noun" },
];

describe("session selection", () => {
  it("filters by content and enabled verb tenses", () => {
    const menu = defaultMenuState();
    menu.includeWords = false;
    menu.tenses.passato_prossimo = false;
    menu.tenses.imperfetto = false;

    expect(buildSessionItems(cards, menu, {}, () => 0.5).map((item) => item.card.id)).toEqual([
      "verb:essere:presente:io",
    ]);
  });

  it("returns no items when all content is disabled", () => {
    const menu = defaultMenuState();
    menu.includeWords = false;
    menu.includeVerbs = false;

    expect(buildSessionItems(cards, menu, {})).toEqual([]);
  });

  it("prioritises lower boxes and cards seen less recently", () => {
    const menu = defaultMenuState();
    menu.includeVerbs = false;
    const extraWord: Card = { id: "word:tempo", type: "word", it: "tempo", nl: "tijd" };
    const progress: Progress = {
      "word:cosa": { box: 3, seen: 2, correct: 2, wrong: 0, last: 100 },
      "word:tempo": { box: 1, seen: 1, correct: 0, wrong: 1, last: 200 },
    };

    const items = buildSessionItems([...cards, extraWord], menu, progress, () => 0.5);
    expect(items.map((item) => item.card.id)).toEqual(["word:tempo", "word:cosa"]);
  });
});
